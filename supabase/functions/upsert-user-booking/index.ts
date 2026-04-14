import { createClient } from "@supabase/supabase-js"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

interface CourtSportWithCourt {
  courts: {
    company_id: string
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get("Authorization")
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Não autorizado." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    )

    const token = authHeader.replace("Bearer ", "")
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token)

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Token inválido." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    // Verifica se é admin
    const { data: adminData } = await supabaseAdmin
      .from("admins")
      .select("id, company_id, is_master")
      .eq("id", user.id)
      .single()

    if (!adminData) {
      return new Response(
        JSON.stringify({ error: "Acesso negado." }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    const { phone, fullname, court_sport_id, booking_start, booking_end, price } = await req.json()

    if (!phone || !fullname || !court_sport_id || !booking_start || !booking_end || !price) {
      return new Response(
        JSON.stringify({ error: "Campos obrigatórios faltando." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    const { data: courtSport } = await supabaseAdmin
      .from("court_sports")
      .select("courts!inner(company_id)")
      .eq("id", court_sport_id)
      .single() as { data: CourtSportWithCourt | null, error: unknown }

    const companyId = (courtSport as CourtSportWithCourt | null)?.courts?.company_id

    if (!companyId) {
      return new Response(
        JSON.stringify({ error: "Quadra não encontrada." }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    // Garante que admin não-master só agenda na própria empresa
    if (!adminData.is_master && adminData.company_id !== companyId) {
      return new Response(
        JSON.stringify({ error: "Acesso negado." }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    // Busca usuário por telefone dentro da empresa
    const { data: usuarioExistente } = await supabaseAdmin
      .from("users")
      .select("id")
      .eq("phone", phone)
      .eq("company_id", companyId)  // filtro por empresa
      .single()

    let userId: string

    if (usuarioExistente) {
      await supabaseAdmin
        .from("users")
        .update({ fullname })
        .eq("id", usuarioExistente.id)

      userId = usuarioExistente.id
    } else {
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        phone,
        phone_confirm: true,
        password: phone,
        user_metadata: { fullname },
      })

      if (authError || !authData.user) {
        return new Response(
          JSON.stringify({ error: "Erro ao criar usuário: " + authError?.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        )
      }

      const { error: userInsertError } = await supabaseAdmin
        .from("users")
        .insert({
          id: authData.user.id,
          fullname,
          phone,
          company_id: companyId,  // campo novo
        })

      if (userInsertError) {
        return new Response(
          JSON.stringify({ error: "Erro ao salvar usuário: " + userInsertError.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        )
      }

      userId = authData.user.id
    }

    const { data: booking, error: bookingError } = await supabaseAdmin
      .from("bookings")
      .insert({
        user_id: userId,
        court_sport_id,
        booking_start,
        booking_end,
        price,
      })
      .select()
      .single()

    if (bookingError) {
      return new Response(
        JSON.stringify({ error: "Erro ao criar agendamento: " + bookingError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    return new Response(
      JSON.stringify({ booking }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )

  } catch (err) {
    return new Response(
      JSON.stringify({ error: "Erro inesperado: " + err }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  }
})
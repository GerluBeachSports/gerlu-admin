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

    const {
      phone,
      fullname,
      court_sport_id,
      day_of_week,
      start_time,
      end_time,
      price,
      valid_from,
      valid_until,
    } = await req.json()

    if (!phone || !fullname || !court_sport_id || day_of_week == null || !start_time || !end_time || !price || !valid_from) {
      return new Response(
        JSON.stringify({ error: "Campos obrigatórios faltando." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    // Resolve o company_id a partir da quadra
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
      .eq("company_id", companyId)
      .single()

    let userId: string

    if (usuarioExistente) {
      await supabaseAdmin
        .from("users")
        .update({ fullname })
        .eq("id", usuarioExistente.id)

      userId = usuarioExistente.id
    } else {
      // Mesmo padrão do site do cliente (BookingCalendar.tsx)
      const digits = phone.replace(/\D/g, "")
      const fakeEmail = `${digits}_${companyId}@quadra.app`
      const fakePassword = `quadra_${digits}`

      let newUserId: string

      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: fakeEmail,
        password: fakePassword,
        email_confirm: true,
        user_metadata: { fullname },
      })

      if (authError) {
        // Usuário já existe no Auth — localiza pelo fake email
        const { data: listData, error: listError } = await supabaseAdmin.auth.admin.listUsers()

        if (listError) {
          return new Response(
            JSON.stringify({ error: "Erro ao buscar usuário existente: " + listError.message }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          )
        }

        const existingAuthUser = listData.users.find((u) => u.email === fakeEmail)

        if (!existingAuthUser) {
          return new Response(
            JSON.stringify({ error: "Erro ao criar usuário no Auth: " + authError.message }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          )
        }

        newUserId = existingAuthUser.id
      } else {
        if (!authData.user) {
          return new Response(
            JSON.stringify({ error: "Erro inesperado ao criar usuário." }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          )
        }
        newUserId = authData.user.id
      }

      // Insere na tabela pública (evita 409 caso já exista)
      const { data: existingPublic } = await supabaseAdmin
        .from("users")
        .select("id")
        .eq("id", newUserId)
        .eq("company_id", companyId)
        .maybeSingle()

      if (!existingPublic) {
        const { error: userInsertError } = await supabaseAdmin
          .from("users")
          .insert({
            id: newUserId,
            fullname,
            phone,
            company_id: companyId,
          })

        if (userInsertError) {
          return new Response(
            JSON.stringify({ error: "Erro ao salvar usuário: " + userInsertError.message }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          )
        }
      }

      userId = newUserId
    }

    // Inserir agendamento fixo
    const { data: recurring, error: recurringError } = await supabaseAdmin
      .from("recurring_bookings")
      .insert({
        user_id: userId,
        court_sport_id,
        day_of_week,
        start_time,
        end_time,
        price,
        valid_from,
        valid_until: valid_until ?? null,
      })
      .select()
      .single()

    if (recurringError) {
      return new Response(
        JSON.stringify({ error: "Erro ao criar agendamento fixo: " + recurringError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    return new Response(
      JSON.stringify({ recurring }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )

  } catch (err: unknown) {
    return new Response(
      JSON.stringify({ error: "Erro inesperado", detail: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  }
})
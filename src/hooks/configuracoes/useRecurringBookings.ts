import { useState, useEffect, useCallback } from "react";
import { supabase } from "../../lib/supabase";

const COMPANY_ID = import.meta.env.VITE_COMPANY_ID

export interface RecurringBooking {
  id: string;
  user_id: string;
  court_sport_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  price: number;
  valid_from: string;
  valid_until: string | null;
  created_at: string;
  user: { fullname: string; phone: string } | null;
  court_sport: {
    court: { id: string; name: string; image_url: string | null } | null;
    sport: { name: string } | null;
  } | null;
}

export interface NovoRecurringBooking {
  fullname: string;
  phone: string;
  court_sport_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  price: number;
  valid_from: string;
  valid_until: string | null;
}

// ── Listagem ──────────────────────────────────────────────────────────────────
export function useRecurringBookings() {
  const [bookings, setBookings] = useState<RecurringBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const buscar = useCallback(async () => {
    setLoading(true);
    setError(null);

    const { data, error: err } = await supabase
      .from("recurring_bookings")
      .select(`
        *,
        user:users(fullname, phone),
        court_sport:court_sports(
          court:courts!inner(id, name, image_url, company_id),
          sport:sports(name)
        )
      `)
      .eq("court_sport.court.company_id", COMPANY_ID)  // filtro por empresa
      .order("day_of_week", { ascending: true })
      .order("start_time", { ascending: true });

    if (err) {
      setError("Erro ao carregar agendamentos fixos.");
      setLoading(false);
      return;
    }

    setBookings(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    buscar();
  }, [buscar]);

  return { bookings, loading, error, refetch: buscar };
}

// ── Criação (via Edge Function) ───────────────────────────────────────────────
export function useNovoRecurringBooking() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function criarRecurringBooking(params: NovoRecurringBooking): Promise<boolean> {
    setLoading(true);
    setError(null);

    const { data: { session } } = await supabase.auth.getSession();

    const { error: fnError } = await supabase.functions.invoke(
      "upsert-recurring-booking",
      {
        body: params,
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      }
    );

    if (fnError) {
      setError("Erro ao criar agendamento fixo.");
      setLoading(false);
      return false;
    }

    setLoading(false);
    return true;
  }

  return { criarRecurringBooking, loading, error };
}

// ── Remoção ───────────────────────────────────────────────────────────────────
export function useRemoverRecurringBooking() {
  const [loading, setLoading] = useState(false);

  async function remover(id: string): Promise<boolean> {
    setLoading(true);
    const { error } = await supabase
      .from("recurring_bookings")
      .delete()
      .eq("id", id);
    setLoading(false);
    return !error;
  }

  return { remover, loading };
}

// ── Edição ────────────────────────────────────────────────────────────────────
export interface EditarRecurringBooking {
  start_time: string;
  end_time: string;
  price: number;
  valid_until: string | null;
}

export function useEditarRecurringBooking() {
  const [loading, setLoading] = useState(false);

  async function editar(id: string, dados: EditarRecurringBooking): Promise<boolean> {
    setLoading(true);
    const { error } = await supabase
      .from("recurring_bookings")
      .update(dados)
      .eq("id", id);
    setLoading(false);
    return !error;
  }

  return { editar, loading };
}
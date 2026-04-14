import { useCallback, useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { CalendarDate, getLocalTimeZone } from "@internationalized/date";

const COMPANY_ID = import.meta.env.VITE_COMPANY_ID

export type Turno = "morning" | "afternoon" | "night";

export interface Agendamento {
  id: string;
  booking_start: string;
  booking_end: string;
  price: number;
  turno: Turno;
  usuario: {
    fullname: string;
    phone: string;
  };
  quadra: {
    name: string;
    image_url: string | null;
  };
  esporte: {
    name: string;
  };
}

function getTurno(date: Date): Turno {
  const hora = date.getHours();
  if (hora >= 13 && hora < 18) return "afternoon";
  if (hora >= 18) return "night";
  return "morning";
}

export function useAgendamentos(dataSelecionada: CalendarDate) {
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const buscar = useCallback(async () => {
    setLoading(true);
    setError(null);

    const jsDate = dataSelecionada.toDate(getLocalTimeZone());
    const inicioDia = new Date(jsDate);
    inicioDia.setHours(0, 0, 0, 0);
    const fimDia = new Date(jsDate);
    fimDia.setHours(23, 59, 59, 999);

    const { data, error: supabaseError } = await supabase
      .from("bookings")
      .select(`
        id,
        booking_start,
        booking_end,
        price,
        users (
          fullname,
          phone
        ),
        court_sports (
          courts!inner ( name, image_url, company_id ),
          sports ( name )
        )
      `)
      .eq("court_sports.courts.company_id", COMPANY_ID)  // filtro por empresa
      .gte("booking_start", inicioDia.toISOString())
      .lte("booking_start", fimDia.toISOString())
      .order("booking_start", { ascending: true });

    if (supabaseError) {
      setError("Erro ao buscar agendamentos.");
      setLoading(false);
      return;
    }

    const formatados: Agendamento[] = (data ?? []).map((b: any) => ({
      id: b.id,
      booking_start: b.booking_start,
      booking_end: b.booking_end,
      price: b.price,
      turno: getTurno(new Date(b.booking_start)),
      usuario: {
        fullname: b.users?.fullname ?? "—",
        phone: b.users?.phone ?? "—",
      },
      quadra: {
        name: b.court_sports?.courts?.name ?? "—",
        image_url: b.court_sports?.courts?.image_url ?? null,
      },
      esporte: {
        name: b.court_sports?.sports?.name ?? "—",
      },
    }));

    setAgendamentos(formatados);
    setLoading(false);
  }, [dataSelecionada]);

  useEffect(() => {
    buscar();
  }, [buscar]);

  return { agendamentos, loading, error, refetch: buscar };
}

// -------------RESUMO DO DIA-------------

export interface ResumoDia {
  quantidade: number;
  faturamento: number;
}

export function useResumoDia(agendamentos: Agendamento[]): ResumoDia {
  const quantidade = agendamentos.length;
  const faturamento = agendamentos.reduce(
    (acc, ag) => acc + (ag.price ?? 0),
    0,
  );
  return { quantidade, faturamento };
}

// ---------------MÊS---------------

export interface AgendamentoResumoMes {
  dia: number;
  turno: Turno;
  quantidade: number;
}

export function useAgendamentosMes(dataSelecionada: CalendarDate) {
  const [resumo, setResumo] = useState<Record<number, AgendamentoResumoMes[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const buscar = useCallback(async () => {
    setLoading(true);
    setError(null);

    const jsDate = dataSelecionada.toDate(getLocalTimeZone());
    const ano = jsDate.getFullYear();
    const mes = jsDate.getMonth();

    const inicioMes = new Date(ano, mes, 1, 0, 0, 0, 0);
    const fimMes = new Date(ano, mes + 1, 0, 23, 59, 59, 999);

    const { data, error: supabaseError } = await supabase
      .from("bookings")
      .select(`
        id,
        booking_start,
        court_sports (
          courts!inner ( company_id )
        )
      `)
      .eq("court_sports.courts.company_id", COMPANY_ID)  // filtro por empresa
      .gte("booking_start", inicioMes.toISOString())
      .lte("booking_start", fimMes.toISOString())
      .order("booking_start", { ascending: true });

    if (supabaseError) {
      setError("Erro ao buscar agendamentos do mês.");
      setLoading(false);
      return;
    }

    const agrupado: Record<number, Record<Turno, number>> = {};

    for (const b of data ?? []) {
      const date = new Date(b.booking_start);
      const dia = date.getDate();
      const turno = getTurno(date);

      if (!agrupado[dia]) {
        agrupado[dia] = { morning: 0, afternoon: 0, night: 0 };
      }
      agrupado[dia][turno]++;
    }

    const resultado: Record<number, AgendamentoResumoMes[]> = {};
    for (const [diaStr, turnos] of Object.entries(agrupado)) {
      const dia = Number(diaStr);
      resultado[dia] = (Object.entries(turnos) as [Turno, number][])
        .filter(([, qtd]) => qtd > 0)
        .map(([turno, quantidade]) => ({ dia, turno, quantidade }));
    }

    setResumo(resultado);
    setLoading(false);
  }, [dataSelecionada]);

  useEffect(() => {
    buscar();
  }, [buscar]);

  return { resumo, loading, error };
}
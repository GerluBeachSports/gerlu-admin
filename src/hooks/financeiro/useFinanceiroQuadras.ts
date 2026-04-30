import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
const COMPANY_ID = import.meta.env.VITE_COMPANY_ID

// ── Tipos ─────────────────────────────────────────────────────────────────────
export interface QuadrasKpis {
  faturamento: number;
  agendamentos: number;
  clientes: number;
  quadraMaisAlugada: string;
}
export interface EsporteData {
  esporte: string;
  agendamentos: number;
  faturamento: number;
}
export interface SemanaData {
  semana: number;
  agendamentos: number;
  faturamento: number;
}
export interface MesData {
  mes: string;
  faturamento: number;
  agendamentos: number;
}
export interface MesEsporteData {
  mes: string;
  esporte: string;
  agendamentos: number;
}

// ── Hook mensal — re-executa apenas quando mês/ano mudam ─────────────────────
export function useFinanceiroQuadrasMes(mes: number, ano: number) {
  const [kpis, setKpis]           = useState<QuadrasKpis | null>(null);
  const [porEsporte, setPorEsporte] = useState<EsporteData[]>([]);
  const [porSemana, setPorSemana]  = useState<SemanaData[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);

  const mesFormatado = `${ano}-${String(mes + 1).padStart(2, "0")}-01`;

  useEffect(() => {
    setLoading(true);
    setError(null);

    async function buscar() {
      const [kpisRes, esportesRes, semanasRes] = await Promise.all([
  supabase.rpc("get_quadras_kpis",     { p_mes: mesFormatado, p_company_id: COMPANY_ID }),
  supabase.rpc("get_quadras_esportes", { p_mes: mesFormatado, p_company_id: COMPANY_ID }),
  supabase.rpc("get_quadras_semanas",  { p_mes: mesFormatado, p_company_id: COMPANY_ID }),
]);

      if (kpisRes.error || esportesRes.error || semanasRes.error) {
        setError("Erro ao carregar dados do mês.");
        setLoading(false);
        return;
      }

      setKpis(kpisRes.data);
      setPorEsporte(esportesRes.data ?? []);
      setPorSemana(semanasRes.data ?? []);
      setLoading(false);
    }

    buscar();
  }, [mesFormatado]);

  return { kpis, porEsporte, porSemana, loading, error };
}

// ── Hook anual — re-executa apenas quando o ano anual muda ───────────────────
export function useFinanceiroQuadrasAnual(yearAnual: number) {
  const [anual, setAnual]                     = useState<MesData[]>([]);
  const [anualPorEsporte, setAnualPorEsporte] = useState<MesEsporteData[]>([]);

  useEffect(() => {
    async function buscar() {
      const [anualRes, anualEsportesRes] = await Promise.all([
        supabase.rpc("get_quadras_anual", { 
          p_ano: yearAnual, 
          p_company_id: COMPANY_ID  // 👈 adiciona isso
        }),
        supabase.rpc("get_quadras_anual_esportes", { 
          p_ano: yearAnual,
          p_company_id: COMPANY_ID  // 👈 verifica se essa também precisa
        }),
      ]);

      //console.log("anualRes:", anualRes)
      //console.log("anualEsportesRes:", anualEsportesRes)

      if (!anualRes.error)         setAnual(anualRes.data ?? []);
      if (!anualEsportesRes.error) setAnualPorEsporte(anualEsportesRes.data ?? []);
    }

    buscar();
  }, [yearAnual]);

  return { anual, anualPorEsporte };
}
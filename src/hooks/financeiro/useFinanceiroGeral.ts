import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";

// ── Tipos ─────────────────────────────────────────────────────────────────────
export interface GeralKpis {
  faturamentoTotal: number;
  faturamentoQuadras: number;
  faturamentoComandas: number;
  agendamentos: number;
}
export interface GeralSemanaData {
  semana: number;
  faturamento: number;
}
export interface GeralMesData {
  mes: string;
  total: number;
}
export interface GeralMesSegmentadoData {
  mes: string;
  quadras: number;
}

// ── Hook mensal — re-executa apenas quando mês/ano mudam ─────────────────────
export function useFinanceiroGeralMes(mes: number, ano: number) {
  const [kpis, setKpis]         = useState<GeralKpis | null>(null);
  const [porSemana, setPorSemana] = useState<GeralSemanaData[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);

  const mesFormatado = `${ano}-${String(mes + 1).padStart(2, "0")}-01`;

  useEffect(() => {
    setLoading(true);
    setError(null);

    async function buscar() {
      const [kpisRes, semanasRes] = await Promise.all([
        supabase.rpc("get_geral_kpis",    { p_mes: mesFormatado }),
        supabase.rpc("get_geral_semanas", { p_mes: mesFormatado }),
      ]);

      if (kpisRes.error || semanasRes.error) {
        setError("Erro ao carregar dados gerais.");
        setLoading(false);
        return;
      }

      setKpis(kpisRes.data);
      setPorSemana(semanasRes.data ?? []);
      setLoading(false);
    }

    buscar();
  }, [mesFormatado]);

  return { kpis, porSemana, loading, error };
}

// ── Hook anual — re-executa apenas quando o ano anual muda ───────────────────
export function useFinanceiroGeralAnual(yearAnual: number) {
  const [anual, setAnual]                     = useState<GeralMesData[]>([]);
  const [anualSegmentado, setAnualSegmentado] = useState<GeralMesSegmentadoData[]>([]);

  useEffect(() => {
    async function buscar() {
      const [anualRes, segmentadoRes] = await Promise.all([
        supabase.rpc("get_geral_anual",            { p_ano: yearAnual }),
        supabase.rpc("get_geral_anual_segmentado", { p_ano: yearAnual }),
      ]);

      if (!anualRes.error)      setAnual(anualRes.data ?? []);
      if (!segmentadoRes.error) setAnualSegmentado(segmentadoRes.data ?? []);
    }

    buscar();
  }, [yearAnual]);

  return { anual, anualSegmentado };
}
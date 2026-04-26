import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
const COMPANY_ID = import.meta.env.VITE_COMPANY_ID

export interface ComandasKpis {
  faturamentoTotal: number
  comandasFechadas: number
  produtoMaisVendido: string
  ticketMedio: number
}

export interface ComandasSemanaData {
  semana: number
  faturamento: number
}

export function useFinanceiroComandasMes(mes: number, ano: number) {
  const [kpis, setKpis] = useState<ComandasKpis | null>(null)
  const [porSemana, setPorSemana] = useState<ComandasSemanaData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const mesFormatado = `${ano}-${String(mes + 1).padStart(2, '0')}-01`

  useEffect(() => {
    setLoading(true)
    setError(null)

    async function buscar() {
      const [kpisRes, semanasRes] = await Promise.all([
  supabase.rpc('get_comandas_kpis', { p_mes: mesFormatado, p_company_id: COMPANY_ID }),
  supabase.rpc('get_comandas_semanas', { p_mes: mesFormatado, p_company_id: COMPANY_ID }),
])

      if (kpisRes.error || semanasRes.error) {
        setError('Erro ao carregar dados de comandas.')
        setLoading(false)
        return
      }

      setKpis(kpisRes.data)
      setPorSemana(semanasRes.data ?? [])
      setLoading(false)
    }

    buscar()
  }, [mesFormatado])

  return { kpis, porSemana, loading, error }
}
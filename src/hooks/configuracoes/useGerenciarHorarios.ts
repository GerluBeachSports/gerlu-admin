import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

const COMPANY_ID = import.meta.env.VITE_COMPANY_ID

export interface GradePadrao {
  id: string
  court_id?: string
  day_of_week: number
  open_time: string
  close_time: string
}

export interface Excecao {
  id: string
  date: string
  open_time: string | null
  close_time: string | null
  open_time_2: string | null
  close_time_2: string | null
  reason: string | null
}

export interface QuadraHorarios {
  id: string
  name: string
  grade: GradePadrao[]
  excecoes: Excecao[]
  totalExcecoes: number
}

const EXCECOES_POR_PAGINA = 5

export function useGerenciarHorarios() {
  const [quadras, setQuadras] = useState<QuadraHorarios[]>([])
  const [loading, setLoading] = useState(true)
  const [paginas, setPaginas] = useState<Record<string, number>>({})

  const buscar = useCallback(async () => {
    setLoading(true)

    const { data: courts } = await supabase
      .from('courts')
      .select('id, name')
      .eq('company_id', COMPANY_ID)
      .order('name')

    if (!courts) { setLoading(false); return }

    const [{ data: grades }, { data: excecoes }] = await Promise.all([
      supabase
        .from('court_opening_interval')
        .select('id, court_id, day_of_week, open_time, close_time')
        .in('court_id', courts.map(c => c.id))
        .order('day_of_week'),
      supabase
        .from('court_schedule_exception')
        .select('id, court_id, date, open_time, close_time, open_time_2, close_time_2, reason')
        .in('court_id', courts.map(c => c.id))
        .order('date', { ascending: true }),
    ])

    const resultado: QuadraHorarios[] = courts.map(court => {
      const gradeQuadra = (grades ?? [])
        .filter((g: any) => g.court_id === court.id)
        .map((g: any) => ({
          id: g.id,
          day_of_week: g.day_of_week,
          open_time: g.open_time,
          close_time: g.close_time,
        }))

      const excecoesQuadra = (excecoes ?? [])
        .filter((e: any) => e.court_id === court.id)
        .map((e: any) => ({
          id: e.id,
          date: e.date,
          open_time: e.open_time,
          close_time: e.close_time,
          open_time_2: e.open_time_2,
          close_time_2: e.close_time_2,
          reason: e.reason,
        }))

      return {
        id: court.id,
        name: court.name,
        grade: gradeQuadra,
        excecoes: excecoesQuadra,
        totalExcecoes: excecoesQuadra.length,
      }
    })

    setQuadras(resultado)
    setLoading(false)
  }, [])

  useEffect(() => { buscar() }, [buscar])

  async function salvarGrade(params: {
    id?: string
    court_id?: string
    day_of_week?: number
    open_time: string
    close_time: string
  }): Promise<boolean> {
    if (params.id) {
      const { error } = await supabase
        .from('court_opening_interval')
        .update({ open_time: params.open_time, close_time: params.close_time })
        .eq('id', params.id)
      if (error) return false
    } else {
      const { error } = await supabase
        .from('court_opening_interval')
        .insert({
          court_id: params.court_id,
          day_of_week: params.day_of_week,
          open_time: params.open_time,
          close_time: params.close_time,
        })
      if (error) return false
    }
    await buscar()
    return true
  }

  async function salvarExcecao(courtId: string, dados: {
    id?: string
    date: string
    open_time: string | null
    close_time: string | null
    open_time_2: string | null
    close_time_2: string | null
    reason: string | null
  }): Promise<boolean> {
    if (dados.id) {
      const { error } = await supabase
        .from('court_schedule_exception')
        .update({
          date: dados.date,
          open_time: dados.open_time,
          close_time: dados.close_time,
          open_time_2: dados.open_time_2,
          close_time_2: dados.close_time_2,
          reason: dados.reason,
        })
        .eq('id', dados.id)
      if (error) return false
    } else {
      const { error } = await supabase
        .from('court_schedule_exception')
        .upsert(
          { court_id: courtId, ...dados },
          { onConflict: 'court_id,date' }
        )
      if (error) return false
    }
    await buscar()
    return true
  }

  async function excluirExcecao(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('court_schedule_exception')
      .delete()
      .eq('id', id)
    if (error) return false
    await buscar()
    return true
  }

  function getPagina(courtId: string) {
    return paginas[courtId] ?? 1
  }

  function setPagina(courtId: string, pagina: number) {
    setPaginas(prev => ({ ...prev, [courtId]: pagina }))
  }

  function getExcecoesPaginadas(quadra: QuadraHorarios) {
    const pagina = getPagina(quadra.id)
    const inicio = (pagina - 1) * EXCECOES_POR_PAGINA
    return {
      itens: quadra.excecoes.slice(inicio, inicio + EXCECOES_POR_PAGINA),
      totalPaginas: Math.ceil(quadra.excecoes.length / EXCECOES_POR_PAGINA),
      pagina,
    }
  }

  return {
    quadras, loading,
    salvarGrade, salvarExcecao, excluirExcecao,
    getPagina, setPagina, getExcecoesPaginadas,
    refetch: buscar,
  }
}
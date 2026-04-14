import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

const COMPANY_ID = import.meta.env.VITE_COMPANY_ID

export interface Esporte {
  id: string
  name: string
}

export interface QuadraCompleta {
  id: string
  name: string
  image_url: string | null
  esportes: Esporte[]
}

export interface FaixaPreco {
  id: string
  day_of_week: number
  start_time: string
  end_time: string
  price: number
  slot_duration_minutes: 60 | 120 | 180
}

// ─── Quadras ──────────────────────────────────────────────────────────────────

export function useConfiguracoesQuadras() {
  const [quadras, setQuadras] = useState<QuadraCompleta[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const buscar = useCallback(async () => {
    setLoading(true)
    setError(null)

    const { data, error: err } = await supabase
      .from('courts')
      .select(`
        id, name, image_url,
        court_sports ( id, sports ( id, name ) )
      `)
      .eq('company_id', COMPANY_ID)  // filtro por empresa
      .order('name')

    if (err) {
      setError('Erro ao buscar quadras.')
      setLoading(false)
      return
    }

    const formatadas: QuadraCompleta[] = (data ?? []).map((c: any) => ({
      id: c.id,
      name: c.name,
      image_url: c.image_url ?? null,
      esportes: (c.court_sports ?? []).map((cs: any) => ({
        id: cs.sports?.id ?? '',
        name: cs.sports?.name ?? '—',
      })),
    }))

    setQuadras(formatadas)
    setLoading(false)
  }, [])

  useEffect(() => { buscar() }, [buscar])

  async function salvarQuadra(dados: {
    id?: string
    name: string
    image_url: string | null
    sport_ids: string[]
  }): Promise<boolean | string> {
    const isEdicao = !!dados.id

    if (isEdicao) {
      const { error: updateErr } = await supabase
        .from('courts')
        .update({ name: dados.name, image_url: dados.image_url })
        .eq('id', dados.id!)

      if (updateErr) return false

      // Busca os court_sports atuais com seu sport_id
      const { data: csAtuais } = await supabase
        .from('court_sports')
        .select('id, sport_id')
        .eq('court_id', dados.id!)

      const csMap = new Map((csAtuais ?? []).map((cs: any) => [cs.sport_id, cs.id]))
      const sportIdsAtuais = new Set(csMap.keys())
      const sportIdsNovos = new Set(dados.sport_ids)

      // Remove apenas os que foram desmarcados
      const remover = [...sportIdsAtuais].filter(id => !sportIdsNovos.has(id))
      if (remover.length > 0) {
        const idsParaRemover = remover.map(sport_id => csMap.get(sport_id)!)

        // Verifica se existe algum booking futuro vinculado
        const { count } = await supabase
          .from('bookings')
          .select('id', { count: 'exact', head: true })
          .in('court_sport_id', idsParaRemover)
          .gte('booking_start', new Date().toISOString())

        if (count && count > 0) {
          return 'possui_agendamentos'  // altera o retorno de boolean para boolean | string
        }

        // Sem bookings futuros, pode remover com segurança
        const { error: deleteErr } = await supabase
          .from('court_sports')
          .delete()
          .in('id', idsParaRemover)

        if (deleteErr) return false
      }

      // Insere apenas os que são novos
      const inserir = [...sportIdsNovos].filter(id => !sportIdsAtuais.has(id))
      if (inserir.length > 0) {
        const { error: csErr } = await supabase
          .from('court_sports')
          .insert(inserir.map(sport_id => ({ court_id: dados.id!, sport_id })))

        if (csErr) return false
      }

    } else {
      const { data: nova, error: insertErr } = await supabase
        .from('courts')
        .insert({ name: dados.name, image_url: dados.image_url, company_id: COMPANY_ID })
        .select('id')
        .single()

      if (insertErr || !nova) return false

      if (dados.sport_ids.length > 0) {
        const { error: csErr } = await supabase
          .from('court_sports')
          .insert(dados.sport_ids.map(sport_id => ({ court_id: nova.id, sport_id })))

        if (csErr) return false
      }
    }

    await buscar()
    return true
  }

  async function excluirQuadra(courtId: string): Promise<boolean> {
    const { data: courtSports } = await supabase
      .from('court_sports')
      .select('id')
      .eq('court_id', courtId)

    const csIds = (courtSports ?? []).map((cs: any) => cs.id)

    if (csIds.length > 0) {
      const { error: bookingsErr } = await supabase
        .from('bookings')
        .delete()
        .in('court_sport_id', csIds)

      if (bookingsErr) return false

      await supabase.from('court_sports').delete().eq('court_id', courtId)
    }

    await supabase.from('court_opening_interval').delete().eq('court_id', courtId)
    await supabase.from('court_pricing').delete().eq('court_id', courtId)

    const { error: courtErr } = await supabase
      .from('courts')
      .delete()
      .eq('id', courtId)

    if (courtErr) return false

    await buscar()
    return true
  }

  return { quadras, loading, error, salvarQuadra, excluirQuadra, refetch: buscar }
}

// ─── Precificação ─────────────────────────────────────────────────────────────

export function usePrecificacaoQuadra(courtId: string | null) {
  const [faixas, setFaixas] = useState<FaixaPreco[]>([])
  const [loading, setLoading] = useState(false)

  const buscar = useCallback(async () => {
    if (!courtId) { setFaixas([]); return }
    setLoading(true)

    const { data } = await supabase
      .from('court_pricing')
      .select('id, day_of_week, start_time, end_time, price, slot_duration_minutes')
      .eq('court_id', courtId)
      .order('day_of_week')
      .order('start_time')

    setFaixas(
      (data ?? []).map((r: any) => ({
        id: r.id,
        day_of_week: r.day_of_week,
        start_time: r.start_time.slice(0, 5),
        end_time: r.end_time.slice(0, 5),
        price: Number(r.price),
        slot_duration_minutes: r.slot_duration_minutes,
      }))
    )
    setLoading(false)
  }, [courtId])

  useEffect(() => { buscar() }, [buscar])

  async function adicionarFaixa(faixa: Omit<FaixaPreco, 'id'>): Promise<boolean> {
    const { error } = await supabase.from('court_pricing').insert({
      court_id: courtId,
      ...faixa,
    })
    if (error) return false
    await buscar()
    return true
  }

  async function removerFaixa(id: string): Promise<boolean> {
    const { error } = await supabase.from('court_pricing').delete().eq('id', id)
    if (error) return false
    await buscar()
    return true
  }

  return { faixas, loading, adicionarFaixa, removerFaixa }
}

// ─── Esportes ─────────────────────────────────────────────────────────────────

export function useTodosEsportes() {
  const [esportes, setEsportes] = useState<Esporte[]>([])

  useEffect(() => {
    supabase
      .from('sports')
      .select('id, name')
      .order('name')
      .then(({ data }) => setEsportes(data ?? []))
  }, [])

  return { esportes }
}
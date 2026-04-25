import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

const COMPANY_ID = import.meta.env.VITE_COMPANY_ID

export interface PreviewItem {
  name: string
  quantity: number
}

export interface ComandaResumo {
  id: string
  tab_number: number
  status: string
  opened_at: string
  notes: string | null
  total: number
  total_items: number
  preview: PreviewItem[]
}

export function useComandas() {
  const [comandas, setComandas] = useState<ComandaResumo[]>([])
  const [loading, setLoading] = useState(true)

  async function fetchComandas() {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Busca as comandas abertas de hoje com seus itens para montar o preview e o total
    const { data } = await supabase
      .from('tabs')
      .select(`
        id,
        tab_number,
        status,
        opened_at,
        notes,
        tab_items (
          quantity,
          unit_price,
          products ( name )
        )
      `)
      .eq('company_id', COMPANY_ID)
      .eq('status', 'open')
      .gte('opened_at', today.toISOString())
      .order('tab_number')

    if (!data) {
      setComandas([])
      setLoading(false)
      return
    }

    const resumos: ComandaResumo[] = data.map((tab: any) => {
      const items = tab.tab_items ?? []
      const total = items.reduce(
        (acc: number, item: any) => acc + item.quantity * item.unit_price,
        0
      )
      const total_items = items.reduce(
        (acc: number, item: any) => acc + item.quantity,
        0
      )
      const preview: PreviewItem[] = items
        .slice(0, 2)
        .map((item: any) => ({ name: item.products?.name ?? '', quantity: item.quantity }))

      return {
        id: tab.id,
        tab_number: tab.tab_number,
        status: tab.status,
        opened_at: tab.opened_at,
        notes: tab.notes,
        total,
        total_items,
        preview,
      }
    })

    setComandas(resumos)
    setLoading(false)
  }

  useEffect(() => {
    fetchComandas()
  }, [])

  return { comandas, loading, refetch: fetchComandas }
}
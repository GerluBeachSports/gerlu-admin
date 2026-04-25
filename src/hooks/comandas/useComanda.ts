import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

export interface ItemComanda {
  id: string
  quantity: number
  unit_price: number
  product_id: string
  product_name: string
  subtotal: number
}

export interface ComandaDetalhe {
  id: string
  tab_number: number
  status: string
  opened_at: string
  notes: string | null
  items: ItemComanda[]
  total: number
}

export function useComanda(tabId: string | null) {
  const [comanda, setComanda] = useState<ComandaDetalhe | null>(null)
  const [loading, setLoading] = useState(false)

  async function fetchComanda() {
    if (!tabId) return

    setLoading(true)

    const { data } = await supabase
      .from('tabs')
      .select(`
        id,
        tab_number,
        status,
        opened_at,
        notes,
        tab_items (
          id,
          quantity,
          unit_price,
          product_id,
          products ( name )
        )
      `)
      .eq('id', tabId)
      .single()

    if (!data) {
      setComanda(null)
      setLoading(false)
      return
    }

    const items: ItemComanda[] = (data.tab_items ?? []).map((item: any) => ({
      id: item.id,
      quantity: item.quantity,
      unit_price: item.unit_price,
      product_id: item.product_id,
      product_name: item.products?.name ?? '',
      subtotal: item.quantity * item.unit_price,
    }))

    const total = items.reduce((acc, item) => acc + item.subtotal, 0)

    setComanda({
      id: data.id,
      tab_number: data.tab_number,
      status: data.status,
      opened_at: data.opened_at,
      notes: data.notes,
      items,
      total,
    })

    setLoading(false)
  }

  useEffect(() => {
    fetchComanda()
  }, [tabId])

  return { comanda, loading, refetch: fetchComanda }
}
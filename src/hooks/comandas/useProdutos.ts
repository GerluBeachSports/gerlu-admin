import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

const COMPANY_ID = import.meta.env.VITE_COMPANY_ID

export interface Produto {
  id: string
  name: string
  price: number
}

export function useProdutos() {
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('products')
      .select('id, name, price')
      .eq('company_id', COMPANY_ID)
      .eq('is_active', true)
      .order('name')
      .then(({ data }) => {
        setProdutos(data ?? [])
        setLoading(false)
      })
  }, [])

  return { produtos, loading }
}
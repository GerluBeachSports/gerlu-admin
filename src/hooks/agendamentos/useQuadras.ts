import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

const COMPANY_ID = import.meta.env.VITE_COMPANY_ID

export interface Quadra {
  id: string
  name: string
  image_url: string | null
}

export function useQuadras() {
  const [quadras, setQuadras] = useState<Quadra[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('courts')
      .select('id, name, image_url')
      .eq('company_id', COMPANY_ID)
      .order('name')
      .then(({ data }) => {
        setQuadras(data ?? [])
        setLoading(false)
      })
  }, [])

  return { quadras, loading }
}
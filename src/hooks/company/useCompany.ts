import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

const COMPANY_ID = import.meta.env.VITE_COMPANY_ID

export interface Company {
  id: string
  name: string
  address: string | null
  google_maps_link: string | null
  image_url: string | null
}

export function useCompany() {
  const [company, setCompany] = useState<Company | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const buscar = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('company')
      .select('id, name, address, google_maps_link, image_url')
      .eq('id', COMPANY_ID)
      .single()

    setCompany(data ?? null)
    setLoading(false)
  }, [])

  useEffect(() => { buscar() }, [buscar])

  async function salvarCompany(dados: Partial<Omit<Company, 'id'>>): Promise<boolean> {
    if (!company) return false
    setSaving(true)
    setError(null)

    const { error: err } = await supabase
      .from('company')
      .update(dados)
      .eq('id', COMPANY_ID)

    setSaving(false)

    if (err) {
      setError('Erro ao salvar.')
      return false
    }

    setCompany(prev => prev ? { ...prev, ...dados } : prev)
    return true
  }

  return { company, loading, saving, error, salvarCompany, refetch: buscar }
}
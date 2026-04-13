import { useState } from 'react'
import { supabase } from "../lib/supabase"

const COMPANY_ID = import.meta.env.VITE_COMPANY_ID

interface AdminData {
  id: string
  fullname: string
  company_id: string
  is_master: boolean
}

interface LoginParams {
  email: string
  password: string
}

export function useAdminAuth() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function loginAdmin({ email, password }: LoginParams): Promise<AdminData | null> {
    setLoading(true)
    setError(null)

    const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password })

    if (authError) {
      setError('Credenciais inválidas.')
      setLoading(false)
      return null
    }

    const { data: adminData, error: adminError } = await supabase
      .from('admins')
      .select('id, fullname, company_id, is_master')
      .eq('id', data.user.id)
      .single()

    if (adminError || !adminData) {
      await supabase.auth.signOut()
      setError('Acesso negado.')
      setLoading(false)
      return null
    }

    if (!adminData.is_master && adminData.company_id !== COMPANY_ID) {
      await supabase.auth.signOut()
      setError('Acesso negado.')
      setLoading(false)
      return null
    }

    setLoading(false)
    return adminData
  }

  async function logout() {
    await supabase.auth.signOut()
  }

  return { loginAdmin, logout, loading, error }
}
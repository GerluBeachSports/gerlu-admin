import { useEffect, useState, useRef } from 'react'
import { supabase } from '../lib/supabase'

const COMPANY_ID = import.meta.env.VITE_COMPANY_ID

export interface AdminSession {
  isAuthenticated: boolean
  isLoading: boolean
  admin: {
    id: string
    fullname: string
    company_id: string
    is_master: boolean
  } | null
}

export function useAdminSession() {
  const [session, setSession] = useState<AdminSession>({
    isAuthenticated: false,
    isLoading: true,
    admin: null,
  })

  const isFetching = useRef(false)

  const checkAndSetAdmin = async (user: any) => {
    if (!user) {
      setSession({ isAuthenticated: false, isLoading: false, admin: null })
      return
    }

    if (isFetching.current) return
    isFetching.current = true

    try {
      const { data, error } = await supabase
        .from('admins')
        .select('id, fullname, company_id, is_master')
        .eq('id', user.id)
        .single()

      if (error || !data) {
        await supabase.auth.signOut()
        setSession({ isAuthenticated: false, isLoading: false, admin: null })
        return
      }

      // Bloqueia se não for master e não pertencer a essa empresa
      if (!data.is_master && data.company_id !== COMPANY_ID) {
        await supabase.auth.signOut()
        setSession({ isAuthenticated: false, isLoading: false, admin: null })
        return
      }

      setSession({
        isAuthenticated: true,
        isLoading: false,
        admin: data,
      })
    } catch (err) {
      setSession({ isAuthenticated: false, isLoading: false, admin: null })
    } finally {
      isFetching.current = false
    }
  }

  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange((_, authSession) => {
      checkAndSetAdmin(authSession?.user ?? null)
    })

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) checkAndSetAdmin(session.user)
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  return session
}
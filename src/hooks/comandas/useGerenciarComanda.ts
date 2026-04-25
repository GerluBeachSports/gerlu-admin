import { useState } from 'react'
import { supabase } from '../../lib/supabase'

const COMPANY_ID = import.meta.env.VITE_COMPANY_ID

export function useGerenciarComanda() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function getProximoNumero(): Promise<number | null> {
    const { data } = await supabase
      .from('tabs')
      .select('tab_number')
      .eq('company_id', COMPANY_ID)
      .eq('status', 'open')

    const usados = new Set((data ?? []).map((t: any) => t.tab_number))
    const proximo = Array.from({ length: 100 }, (_, i) => i + 1)
      .find(n => !usados.has(n))

    return proximo ?? null
  }

  async function abrirComanda(notes?: string): Promise<string | null> {
    setLoading(true)
    setError(null)

    const proximo = await getProximoNumero()

    if (!proximo) {
      setError('Todas as 100 comandas estão em uso.')
      setLoading(false)
      return null
    }

    const { data, error: insertError } = await supabase
      .from('tabs')
      .insert({ company_id: COMPANY_ID, tab_number: proximo, notes: notes ?? null })
      .select('id')
      .single()

    if (insertError) {
      setError('Erro ao abrir comanda. Tente novamente.')
      setLoading(false)
      return null
    }

    setLoading(false)
    return data.id
  }

  async function adicionarItem(
    tabId: string,
    productId: string,
    price: number,
  ): Promise<boolean> {
    setLoading(true)
    setError(null)

    const { data: existente } = await supabase
      .from('tab_items')
      .select('id, quantity')
      .eq('tab_id', tabId)
      .eq('product_id', productId)
      .single()

    if (existente) {
      const { error: updateError } = await supabase
        .from('tab_items')
        .update({ quantity: existente.quantity + 1 })
        .eq('id', existente.id)

      if (updateError) {
        setError('Erro ao adicionar produto.')
        setLoading(false)
        return false
      }
    } else {
      const { error: insertError } = await supabase
        .from('tab_items')
        .insert({ tab_id: tabId, product_id: productId, unit_price: price, quantity: 1 })

      if (insertError) {
        setError('Erro ao adicionar produto.')
        setLoading(false)
        return false
      }
    }

    setLoading(false)
    return true
  }

  async function alterarQuantidade(itemId: string, novaQuantidade: number): Promise<boolean> {
    setLoading(true)
    setError(null)

    if (novaQuantidade <= 0) {
      const { error: deleteError } = await supabase
        .from('tab_items')
        .delete()
        .eq('id', itemId)

      if (deleteError) {
        setError('Erro ao remover produto.')
        setLoading(false)
        return false
      }
    } else {
      const { error: updateError } = await supabase
        .from('tab_items')
        .update({ quantity: novaQuantidade })
        .eq('id', itemId)

      if (updateError) {
        setError('Erro ao atualizar quantidade.')
        setLoading(false)
        return false
      }
    }

    setLoading(false)
    return true
  }

  async function fecharComanda(tabId: string): Promise<boolean> {
    setLoading(true)
    setError(null)

    const { error: updateError } = await supabase
      .from('tabs')
      .update({ status: 'closed', closed_at: new Date().toISOString() })
      .eq('id', tabId)

    if (updateError) {
      setError('Erro ao fechar comanda.')
      setLoading(false)
      return false
    }

    setLoading(false)
    return true
  }

  async function editarNotes(tabId: string, notes: string): Promise<boolean> {
    setLoading(true)
    setError(null)

    const { error: updateError } = await supabase
      .from('tabs')
      .update({ notes: notes.trim() || null })
      .eq('id', tabId)

    if (updateError) {
      setError('Erro ao salvar anotação.')
      setLoading(false)
      return false
    }

    setLoading(false)
    return true
  }

  async function cancelarComanda(tabId: string): Promise<boolean> {
    setLoading(true)
    setError(null)

    const { error: updateError } = await supabase
      .from('tabs')
      .update({ status: 'cancelled', closed_at: new Date().toISOString() })
      .eq('id', tabId)

    if (updateError) {
      setError('Erro ao cancelar comanda.')
      setLoading(false)
      return false
    }

    setLoading(false)
    return true
  }

  return {
    abrirComanda,
    adicionarItem,
    alterarQuantidade,
    fecharComanda,
    cancelarComanda,
    editarNotes,
    loading,
    error,
  }
}
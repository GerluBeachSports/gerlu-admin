import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

const COMPANY_ID = import.meta.env.VITE_COMPANY_ID

export interface Produto {
  id: string
  name: string
  price: number
  is_active: boolean
  created_at: string
}

export function useProdutosAdmin() {
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [salvando, setSalvando] = useState(false)

  async function fetchProdutos() {
    setLoading(true)
    const { data } = await supabase
      .from('products')
      .select('id, name, price, is_active, created_at')
      .eq('company_id', COMPANY_ID)
      .order('name')

    setProdutos(data ?? [])
    setLoading(false)
  }

  useEffect(() => {
    fetchProdutos()
  }, [])

  async function criarProduto(name: string, price: number): Promise<boolean> {
    setSalvando(true)
    setError(null)

    const { error: insertError } = await supabase
      .from('products')
      .insert({ company_id: COMPANY_ID, name: name.trim(), price })

    if (insertError) {
      setError('Erro ao criar produto.')
      console.error('Erro completo:', insertError) // 👈 adiciona isso
      setError(`Erro: ${insertError.message}`) 
      setSalvando(false)
      return false
    }

    await fetchProdutos()
    setSalvando(false)
    return true
  }

  async function editarProduto(id: string, name: string, price: number): Promise<boolean> {
    setSalvando(true)
    setError(null)

    const { error: updateError } = await supabase
      .from('products')
      .update({ name: name.trim(), price })
      .eq('id', id)

    if (updateError) {
      setError('Erro ao editar produto.')
      setSalvando(false)
      return false
    }

    await fetchProdutos()
    setSalvando(false)
    return true
  }

  async function toggleAtivo(id: string, ativo: boolean): Promise<void> {
    setError(null)

    const { error: updateError } = await supabase
      .from('products')
      .update({ is_active: !ativo })
      .eq('id', id)

    if (updateError) {
      setError('Erro ao alterar status do produto.')
      return
    }

    await fetchProdutos()
  }

  async function excluirProduto(id: string): Promise<boolean> {
    setError(null)

    const { error: deleteError } = await supabase
      .from('products')
      .delete()
      .eq('id', id)

    if (deleteError) {
      setError('Não é possível excluir um produto que já foi usado em comandas.')
      return false
    }

    await fetchProdutos()
    return true
  }

  return {
    produtos,
    loading,
    error,
    salvando,
    criarProduto,
    editarProduto,
    toggleAtivo,
    excluirProduto,
  }
}
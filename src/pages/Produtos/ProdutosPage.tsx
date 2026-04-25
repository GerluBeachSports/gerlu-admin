import { useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  PlusSignIcon,
  ShoppingBag01Icon,
  PencilEdit01Icon,
  Delete02Icon,
  ToggleOnIcon,
  ToggleOffIcon,
} from "@hugeicons/core-free-icons"
import { Button, useDisclosure } from "@heroui/react"
import { useProdutosAdmin, type Produto } from "../../hooks/produtos/useProdutosAdmin"
import { ModalProduto } from "./modals/ModalProduto"

export function ProdutosPage() {
  const {
    produtos, loading, error, salvando,
    criarProduto, editarProduto, toggleAtivo, excluirProduto,
  } = useProdutosAdmin()

  const produtoModal = useDisclosure()
  const [produtoSelecionado, setProdutoSelecionado] = useState<Produto | null>(null)
  const [confirmandoExclusao, setConfirmandoExclusao] = useState<string | null>(null) // produto id

  function handleNovoProduto() {
    setProdutoSelecionado(null)
    produtoModal.onOpen()
  }

  function handleEditar(produto: Produto) {
    setProdutoSelecionado(produto)
    produtoModal.onOpen()
  }

  async function handleSalvar(name: string, price: number): Promise<boolean> {
    if (produtoSelecionado) {
      return editarProduto(produtoSelecionado.id, name, price)
    }
    return criarProduto(name, price)
  }

  async function handleExcluir(id: string) {
    const ok = await excluirProduto(id)
    if (ok) setConfirmandoExclusao(null)
  }

  const ativos = produtos.filter(p => p.is_active)
  const inativos = produtos.filter(p => !p.is_active)

  return (
    <main className="px-12 pb-12 mt-10">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <HugeiconsIcon icon={ShoppingBag01Icon} size={28} className="text-brand" />
          <h1 className="font-montserrat font-bold text-2xl text-brand">Produtos</h1>
          {!loading && (
            <span className="text-sm text-gray-400 font-montserrat">
              {ativos.length} ativos
            </span>
          )}
        </div>

        <Button
          className="bg-brand text-white font-semibold rounded-xl"
          startContent={<HugeiconsIcon icon={PlusSignIcon} size={16} />}
          onPress={handleNovoProduto}
        >
          Novo Produto
        </Button>
      </div>

      {error && (
        <p className="text-sm text-red-500 mb-4">{error}</p>
      )}

      {loading && (
        <p className="text-sm text-gray-400 animate-pulse">Carregando produtos...</p>
      )}

      {!loading && produtos.length === 0 && (
        <div className="flex flex-col items-center gap-3 mt-24 text-gray-400">
          <HugeiconsIcon icon={ShoppingBag01Icon} size={48} />
          <p className="font-montserrat text-sm">Nenhum produto cadastrado.</p>
        </div>
      )}

      {!loading && produtos.length > 0 && (
        <div className="flex flex-col gap-8">
          {/* Tabela de produtos ativos */}
          {ativos.length > 0 && (
            <TabelaProdutos
              titulo="Ativos"
              produtos={ativos}
              confirmandoExclusao={confirmandoExclusao}
              onEditar={handleEditar}
              onToggle={toggleAtivo}
              onExcluir={handleExcluir}
              onConfirmarExclusao={setConfirmandoExclusao}
            />
          )}

          {/* Tabela de produtos inativos */}
          {inativos.length > 0 && (
            <TabelaProdutos
              titulo="Inativos"
              produtos={inativos}
              confirmandoExclusao={confirmandoExclusao}
              onEditar={handleEditar}
              onToggle={toggleAtivo}
              onExcluir={handleExcluir}
              onConfirmarExclusao={setConfirmandoExclusao}
            />
          )}
        </div>
      )}

      <ModalProduto
        isOpen={produtoModal.isOpen}
        onOpenChange={produtoModal.onOpenChange}
        produto={produtoSelecionado}
        onSalvar={handleSalvar}
        salvando={salvando}
      />
    </main>
  )
}

// ─── Tabela reutilizável ────────────────────────────────────────────────────

interface TabelaProps {
  titulo: string
  produtos: Produto[]
  confirmandoExclusao: string | null
  onEditar: (produto: Produto) => void
  onToggle: (id: string, ativo: boolean) => void
  onExcluir: (id: string) => void
  onConfirmarExclusao: (id: string | null) => void
}

function TabelaProdutos({
  titulo, produtos, confirmandoExclusao,
  onEditar, onToggle, onExcluir, onConfirmarExclusao,
}: TabelaProps) {
  return (
    <section>
      <p className="font-montserrat font-semibold text-sm text-gray-400 mb-2 uppercase tracking-wide">
        {titulo}
      </p>

      <div className="rounded-2xl border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-gray-400 text-left">
              <th className="px-4 py-3 font-medium">Nome</th>
              <th className="px-4 py-3 font-medium">Preço</th>
              <th className="px-4 py-3 font-medium text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {produtos.map((produto, i) => {
              const precoFormatado = produto.price.toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL",
              })
              const excluindo = confirmandoExclusao === produto.id
              const ultimo = i === produtos.length - 1

              return (
                <tr
                  key={produto.id}
                  className={`${!ultimo ? "border-b border-gray-100" : ""} hover:bg-gray-50 transition-colors`}
                >
                  <td className="px-4 py-3 font-medium">{produto.name}</td>
                  <td className="px-4 py-3 text-brand font-semibold">{precoFormatado}</td>
                  <td className="px-4 py-3">
                    {excluindo ? (
                      // Confirmação de exclusão inline
                      <div className="flex items-center justify-end gap-2">
                        <span className="text-xs text-gray-500">Excluir?</span>
                        <button
                          className="text-xs text-gray-400 border border-gray-200 rounded-lg px-2 py-1"
                          onClick={() => onConfirmarExclusao(null)}
                        >
                          Não
                        </button>
                        <button
                          className="text-xs text-white bg-red-500 rounded-lg px-2 py-1 font-semibold"
                          onClick={() => onExcluir(produto.id)}
                        >
                          Sim
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-end gap-1">
                        {/* Editar */}
                        <button
                          className="p-1.5 rounded-lg text-gray-400 hover:text-brand hover:bg-brand/10 transition-colors"
                          onClick={() => onEditar(produto)}
                          title="Editar"
                        >
                          <HugeiconsIcon icon={PencilEdit01Icon} size={17} />
                        </button>

                        {/* Ativar / Desativar */}
                        <button
                          className={`p-1.5 rounded-lg transition-colors ${
                            produto.is_active
                              ? "text-brand hover:bg-brand/10"
                              : "text-gray-300 hover:bg-gray-100"
                          }`}
                          onClick={() => onToggle(produto.id, produto.is_active)}
                          title={produto.is_active ? "Desativar" : "Ativar"}
                        >
                          <HugeiconsIcon
                            icon={produto.is_active ? ToggleOnIcon : ToggleOffIcon}
                            size={17}
                          />
                        </button>

                        {/* Excluir */}
                        <button
                          className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                          onClick={() => onConfirmarExclusao(produto.id)}
                          title="Excluir"
                        >
                          <HugeiconsIcon icon={Delete02Icon} size={17} />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </section>
  )
}
import { useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { Search01Icon, PlusSignIcon } from "@hugeicons/core-free-icons"
import {
  Modal, ModalContent, ModalHeader, ModalBody, Button,
} from "@heroui/react"
import { useProdutos } from "../../../hooks/comandas/useProdutos"
import { useGerenciarComanda } from "../../../hooks/comandas/useGerenciarComanda"

interface Props {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  tabId: string
  onItemAdicionado: () => void
}

export function ModalAdicionarProduto({ isOpen, onOpenChange, tabId, onItemAdicionado }: Props) {
  const { produtos, loading: loadingProdutos } = useProdutos()
  const { adicionarItem, loading: loadingAdicionar, error } = useGerenciarComanda()
  const [busca, setBusca] = useState("")
  const [adicionando, setAdicionando] = useState<string | null>(null) // product_id sendo adicionado

  const produtosFiltrados = produtos.filter(p =>
    p.name.toLowerCase().includes(busca.toLowerCase())
  )

  async function handleAdicionar(productId: string, price: number) {
    setAdicionando(productId)
    const ok = await adicionarItem(tabId, productId, price)
    setAdicionando(null)
    if (ok) onItemAdicionado()
  }

  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      placement="center"
      hideCloseButton
    >
      <ModalContent>
        <>
          <ModalHeader className="bg-brandsecondary rounded-t-xl">
            <h2 className="text-white font-montserrat text-lg font-bold w-full text-center">
              Adicionar Produto
            </h2>
          </ModalHeader>

          <ModalBody className="py-4 px-4 space-y-3">
            {/* Campo de busca */}
            <div className="flex items-center gap-2 border border-gray-200 rounded-xl px-3 py-2">
              <HugeiconsIcon icon={Search01Icon} size={18} className="text-gray-400 shrink-0" />
              <input
                type="text"
                placeholder="Buscar produto..."
                value={busca}
                onChange={e => setBusca(e.target.value)}
                className="w-full text-sm outline-none bg-transparent"
              />
            </div>

            {/* Lista de produtos */}
            <div className="flex flex-col gap-y-2 max-h-72 overflow-y-auto pr-1">
              {loadingProdutos && (
                <p className="text-sm text-gray-400 animate-pulse text-center py-4">
                  Carregando produtos...
                </p>
              )}

              {!loadingProdutos && produtosFiltrados.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-4">
                  Nenhum produto encontrado.
                </p>
              )}

              {!loadingProdutos && produtosFiltrados.map(produto => {
                const precoFormatado = produto.price.toLocaleString("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                })
                const esteAdicionando = adicionando === produto.id

                return (
                  <div
                    key={produto.id}
                    className="flex items-center justify-between px-3 py-2 rounded-xl border border-gray-100 hover:border-brand transition-colors"
                  >
                    <div>
                      <p className="text-sm font-medium">{produto.name}</p>
                      <p className="text-xs text-brand font-semibold">{precoFormatado}</p>
                    </div>
                    <Button
                      isIconOnly
                      size="sm"
                      className="bg-brand text-white rounded-lg"
                      isLoading={esteAdicionando}
                      isDisabled={loadingAdicionar}
                      onPress={() => handleAdicionar(produto.id, produto.price)}
                    >
                      {!esteAdicionando && <HugeiconsIcon icon={PlusSignIcon} size={16} />}
                    </Button>
                  </div>
                )
              })}
            </div>

            {error && (
              <p className="text-xs text-red-500 text-center">{error}</p>
            )}
          </ModalBody>
        </>
      </ModalContent>
    </Modal>
  )
}
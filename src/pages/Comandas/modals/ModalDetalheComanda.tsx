import { useState, useEffect } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  ShoppingBasket01Icon,
  PlusSignIcon,
  MinusSignIcon,
  NoteEditIcon,
  FloppyDiskIcon,
} from "@hugeicons/core-free-icons"
import {
  Modal, ModalContent, ModalHeader, ModalBody, ModalFooter,
  Button, useDisclosure,
} from "@heroui/react"
import { useComanda } from "../../../hooks/comandas/useComanda"
import { useGerenciarComanda } from "../../../hooks/comandas/useGerenciarComanda"
import { ModalAdicionarProduto } from "./ModalAdicionarProduto"

interface Props {
  tabId: string | null
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onComandaFechada: () => void
}

export function ModalDetalheComanda({ tabId, isOpen, onOpenChange, onComandaFechada }: Props) {
  const { comanda, loading, refetch } = useComanda(tabId)
  const { alterarQuantidade, fecharComanda, cancelarComanda, editarNotes, loading: loadingAcao, error } = useGerenciarComanda()
  const adicionarModal = useDisclosure()
  const [alterando, setAlterando] = useState<string | null>(null)
  const [confirmando, setConfirmando] = useState<"fechar" | "cancelar" | null>(null)
  const [editandoNotes, setEditandoNotes] = useState(false)
  const [notesValor, setNotesValor] = useState("")
  const [salvandoNotes, setSalvandoNotes] = useState(false)

  // Estado local dos itens — evita refetch completo ao alterar quantidade
  const [itensLocais, setItensLocais] = useState(comanda?.items ?? [])

  // Sincroniza itensLocais quando a comanda carrega ou quando a lista de itens muda
  // (ex: novo produto adicionado pelo ModalAdicionarProduto)
  useEffect(() => {
    if (comanda) {
      setItensLocais(comanda.items)
      setNotesValor(comanda.notes ?? "")
    }
  }, [comanda?.id, comanda?.items.length])

  const totalLocal = itensLocais.reduce((acc, item) => acc + item.subtotal, 0)
  const totalFormatado = totalLocal.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  })

  async function handleAlterar(itemId: string, novaQuantidade: number) {
    setAlterando(itemId)

    // Atualiza o estado local imediatamente — sem refetch
    if (novaQuantidade <= 0) {
      setItensLocais(prev => prev.filter(i => i.id !== itemId))
    } else {
      setItensLocais(prev => prev.map(i =>
        i.id === itemId
          ? { ...i, quantity: novaQuantidade, subtotal: novaQuantidade * i.unit_price }
          : i
      ))
    }

    await alterarQuantidade(itemId, novaQuantidade)
    setAlterando(null)
  }

  async function handleFechar() {
    if (!tabId) return
    const ok = await fecharComanda(tabId)
    if (ok) { onComandaFechada(); setConfirmando(null) }
  }

  async function handleCancelar() {
    if (!tabId) return
    const ok = await cancelarComanda(tabId)
    if (ok) { onComandaFechada(); setConfirmando(null) }
  }

  async function handleSalvarNotes() {
    if (!tabId) return
    setSalvandoNotes(true)
    const ok = await editarNotes(tabId, notesValor)
    setSalvandoNotes(false)
    if (ok) { setEditandoNotes(false); refetch() }
  }

  return (
    <>
      <Modal
        isOpen={isOpen}
        onOpenChange={(open) => {
          if (!open) setConfirmando(null)
          onOpenChange(open)
        }}
        placement="center"
        hideCloseButton
      >
        <ModalContent>
          <>
            <ModalHeader className="bg-brand rounded-t-xl">
              <h2 className="text-white font-montserrat text-lg font-bold w-full text-center">
                {comanda ? `Comanda #${comanda.tab_number}` : "Carregando..."}
              </h2>
            </ModalHeader>

            <ModalBody className="py-4 px-4">
              {loading && (
                <p className="text-sm text-gray-400 animate-pulse text-center py-6">
                  Carregando...
                </p>
              )}

              {!loading && comanda && (
                <div className="flex flex-col gap-y-2">
                  {/* Itens */}
                  {itensLocais.length === 0 ? (
                    <div className="flex flex-col items-center gap-2 py-6 text-gray-400">
                      <HugeiconsIcon icon={ShoppingBasket01Icon} size={32} />
                      <p className="text-sm">Nenhum item na comanda.</p>
                    </div>
                  ) : (
                    <>
                      {itensLocais.map(item => {
                        const subtotalFormatado = item.subtotal.toLocaleString("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        })
                        const esteAlterando = alterando === item.id

                        return (
                          <div
                            key={item.id}
                            className="flex items-center justify-between px-3 py-2 rounded-xl border border-gray-100"
                          >
                            <div>
                              <p className="text-sm font-medium">{item.product_name}</p>
                              <p className="text-xs text-gray-400">{subtotalFormatado}</p>
                            </div>

                            {/* Controles de quantidade */}
                            <div className="flex items-center gap-2">
                              <Button
                                isIconOnly
                                size="sm"
                                variant="bordered"
                                className="rounded-lg border-gray-200 text-gray-500 min-w-7 w-7 h-7"
                                isLoading={esteAlterando}
                                isDisabled={loadingAcao}
                                onPress={() => handleAlterar(item.id, item.quantity - 1)}
                              >
                                {!esteAlterando && <HugeiconsIcon icon={MinusSignIcon} size={13} />}
                              </Button>

                              <span className="text-sm font-semibold w-4 text-center">
                                {item.quantity}
                              </span>

                              <Button
                                isIconOnly
                                size="sm"
                                className="rounded-lg bg-brand text-white min-w-7 w-7 h-7"
                                isDisabled={loadingAcao}
                                onPress={() => handleAlterar(item.id, item.quantity + 1)}
                              >
                                <HugeiconsIcon icon={PlusSignIcon} size={13} />
                              </Button>
                            </div>
                          </div>
                        )
                      })}

                      {/* Total */}
                      <div className="flex justify-between items-center pt-2 border-t border-gray-100 mt-1 px-1">
                        <span className="text-sm font-semibold text-gray-500">Total</span>
                        <span className="text-base font-bold text-brand">{totalFormatado}</span>
                      </div>
                    </>
                  )}

                  {/* Notes */}
                  <div className="mt-2 border-t border-gray-100 pt-3">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1 text-gray-400">
                        <HugeiconsIcon icon={NoteEditIcon} size={14} />
                        <span className="text-xs font-medium">Anotações</span>
                      </div>
                      {!editandoNotes && (
                        <button
                          className="text-xs text-brandsecondary font-medium"
                          onClick={() => setEditandoNotes(true)}
                        >
                          Editar
                        </button>
                      )}
                    </div>

                    {editandoNotes ? (
                      <div className="flex flex-col gap-2">
                        <textarea
                          value={notesValor}
                          onChange={e => setNotesValor(e.target.value)}
                          placeholder="Adicione uma anotação..."
                          rows={3}
                          className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 outline-none resize-none focus:border-brand transition-colors"
                        />
                        <div className="flex gap-2">
                          <button
                            className="flex-1 text-xs text-gray-400 border border-gray-200 rounded-xl py-1.5"
                            onClick={() => { setEditandoNotes(false); setNotesValor(comanda.notes ?? "") }}
                            disabled={salvandoNotes}
                          >
                            Cancelar
                          </button>
                          <button
                            className="flex-1 text-xs text-white bg-brand rounded-xl py-1.5 flex items-center justify-center gap-1 font-semibold"
                            onClick={handleSalvarNotes}
                            disabled={salvandoNotes}
                          >
                            <HugeiconsIcon icon={FloppyDiskIcon} size={13} />
                            {salvandoNotes ? "Salvando..." : "Salvar"}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 italic">
                        {comanda.notes || "Sem anotações"}
                      </p>
                    )}
                  </div>

                  {/* Confirmação inline de fechar/cancelar */}
                  {confirmando && (
                    <div className="mt-2 p-3 rounded-xl bg-gray-50 border border-gray-200 text-center space-y-2">
                      <p className="text-sm font-medium text-gray-700">
                        {confirmando === "fechar"
                          ? "Confirmar fechamento da comanda?"
                          : "Confirmar cancelamento da comanda?"}
                      </p>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="bordered"
                          className="flex-1 rounded-xl border-gray-300 text-gray-500"
                          onPress={() => setConfirmando(null)}
                          isDisabled={loadingAcao}
                        >
                          Voltar
                        </Button>
                        <Button
                          size="sm"
                          className={`flex-1 rounded-xl text-white font-semibold ${
                            confirmando === "fechar" ? "bg-brand" : "bg-red-500"
                          }`}
                          isLoading={loadingAcao}
                          onPress={confirmando === "fechar" ? handleFechar : handleCancelar}
                        >
                          Confirmar
                        </Button>
                      </div>
                    </div>
                  )}

                  {error && (
                    <p className="text-xs text-red-500 text-center">{error}</p>
                  )}
                </div>
              )}
            </ModalBody>

            {!loading && comanda && !confirmando && (
              <ModalFooter className="flex flex-col gap-2 pt-0">
                <Button
                  className="w-full rounded-xl bg-brandsecondary text-white font-semibold"
                  startContent={<HugeiconsIcon icon={PlusSignIcon} size={16} />}
                  onPress={adicionarModal.onOpen}
                >
                  Adicionar Produto
                </Button>

                <div className="flex gap-2 w-full">
                  <Button
                    variant="bordered"
                    className="flex-1 rounded-xl border-red-400 text-red-400 font-semibold"
                    onPress={() => setConfirmando("cancelar")}
                  >
                    Cancelar
                  </Button>
                  <Button
                    className="flex-1 rounded-xl bg-brand text-white font-semibold"
                    onPress={() => setConfirmando("fechar")}
                  >
                    Fechar Comanda
                  </Button>
                </div>
              </ModalFooter>
            )}
          </>
        </ModalContent>
      </Modal>

      {tabId && (
        <ModalAdicionarProduto
          isOpen={adicionarModal.isOpen}
          onOpenChange={adicionarModal.onOpenChange}
          tabId={tabId}
          onItemAdicionado={refetch}
        />
      )}
    </>
  )
}
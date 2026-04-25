import { useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { PlusSignIcon, ShoppingBasket01Icon, ShoppingBag01Icon } from "@hugeicons/core-free-icons"
import { Button, useDisclosure } from "@heroui/react"
import { useComandas, type ComandaResumo } from "../../hooks/comandas/useComandas"
import { useGerenciarComanda } from "../../hooks/comandas/useGerenciarComanda"
import { CardComanda } from "./components/CardComanda"
import { ModalDetalheComanda } from "./modals/ModalDetalheComanda"

export function ComandasPage() {
  const { comandas, loading, refetch } = useComandas()
  const { abrirComanda, loading: loadingAbrir, error: errorAbrir } = useGerenciarComanda()
  const detalheModal = useDisclosure()
  const [comandaSelecionada, setComandaSelecionada] = useState<ComandaResumo | null>(null)

  function handleCardClick(comanda: ComandaResumo) {
    setComandaSelecionada(comanda)
    detalheModal.onOpen()
  }

  async function handleNovaComanda() {
    const novoId = await abrirComanda()
    if (!novoId) return // erro já está no hook

    await refetch()

    // Abre direto o modal da nova comanda
    const { data } = await import("../../lib/supabase").then(({ supabase }) =>
      supabase.from("tabs").select("id, tab_number, status, opened_at, notes").eq("id", novoId).single()
    )

    if (data) {
      setComandaSelecionada({
        id: data.id,
        tab_number: data.tab_number,
        status: data.status,
        opened_at: data.opened_at,
        notes: data.notes,
        total: 0,
        total_items: 0,
        preview: [],
      })
      detalheModal.onOpen()
    }
  }

  return (
    <main className="px-12 pb-12 mt-10">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <HugeiconsIcon icon={ShoppingBasket01Icon} size={28} className="text-brand" />
          <h1 className="font-montserrat font-bold text-2xl text-brand">Comandas</h1>
          {!loading && (
            <span className="text-sm text-gray-400 font-montserrat">
              {comandas.length} abertas hoje
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="bordered"
            className="rounded-xl border-brand text-brand font-semibold"
            startContent={<HugeiconsIcon icon={ShoppingBag01Icon} size={16} />}
            href="/produtos"
            as="a"
          >
            Gerenciar Produtos
          </Button>
          <div className="flex flex-col items-end gap-1">
            <Button
              className="bg-brand text-white font-semibold rounded-xl"
              startContent={<HugeiconsIcon icon={PlusSignIcon} size={16} />}
              isLoading={loadingAbrir}
              onPress={handleNovaComanda}
            >
              Nova Comanda
            </Button>
            {errorAbrir && (
              <p className="text-xs text-red-500">{errorAbrir}</p>
            )}
          </div>
        </div>
      </div>

      {/* Grid de cards */}
      {loading && (
        <p className="text-sm text-gray-400 animate-pulse">Carregando comandas...</p>
      )}

      {!loading && comandas.length === 0 && (
        <div className="flex flex-col items-center gap-3 mt-24 text-gray-400">
          <HugeiconsIcon icon={ShoppingBasket01Icon} size={48} />
          <p className="font-montserrat text-sm">Nenhuma comanda aberta hoje.</p>
        </div>
      )}

      {!loading && comandas.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 items-start">
          {comandas.map(comanda => (
            <CardComanda
              key={comanda.id}
              comanda={comanda}
              onClick={handleCardClick}
            />
          ))}
        </div>
      )}

      {/* Modal de detalhe */}
      <ModalDetalheComanda
        tabId={comandaSelecionada?.id ?? null}
        isOpen={detalheModal.isOpen}
        onOpenChange={(open) => {
          if (!open) {
            detalheModal.onClose()
            refetch()
          } else {
            detalheModal.onOpen()
          }
        }}
        onComandaFechada={() => {
          detalheModal.onClose()
          setComandaSelecionada(null)
          refetch()
        }}
      />
    </main>
  )
}
import { HugeiconsIcon } from "@hugeicons/react"
import { ShoppingBasket01Icon } from "@hugeicons/core-free-icons"
import { type ComandaResumo } from "../../../hooks/comandas/useComandas"

interface Props {
  comanda: ComandaResumo
  onClick: (comanda: ComandaResumo) => void
}

export function CardComanda({ comanda, onClick }: Props) {
  const totalFormatado = comanda.total.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  })

  return (
    <button
      className="card-day text-left w-full"
      onClick={() => onClick(comanda)}
    >
      {/* Header com número da comanda */}
      <div className="bg-brand rounded-t-2xl px-4 py-1.5 font-montserrat text-white flex items-center justify-between">
        <span className="font-bold text-lg">#{comanda.tab_number}</span>
        <div className="flex items-center gap-1 text-white/80 text-xs">
          <HugeiconsIcon icon={ShoppingBasket01Icon} size={14} />
          <span>{comanda.total_items}</span>
        </div>
      </div>

      {/* Body com preview, notes e total */}
      <div className="flex flex-col border-x-1 border-b-1 rounded-b-2xl border-brand justify-center py-3 px-3 gap-y-1">
        {comanda.preview.length === 0 ? (
          <p className="text-xs text-gray-400 italic">Sem itens ainda</p>
        ) : (
          comanda.preview.map((item, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-brand shrink-0">x{item.quantity}</span>
              <p className="text-sm truncate text-gray-700">{item.name}</p>
            </div>
          ))
        )}

        {comanda.total > 0 && (
          <p className="text-sm font-semibold text-brand mt-1">{totalFormatado}</p>
        )}

        {/* Notes */}
        <p className="text-xs text-gray-400 truncate mt-1">
          {comanda.notes ? `📝 ${comanda.notes}` : "Sem anotações"}
        </p>
      </div>
    </button>
  )
}
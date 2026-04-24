import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@heroui/react"
import { HugeiconsIcon } from "@hugeicons/react"
import { UserCircleIcon, MapPinCheckIcon, RepeatIcon } from "@hugeicons/core-free-icons"
import { type RecurringNoDia } from "../../../hooks/agendamentos/useRecurringNoMes"
import { useRemoverRecurringBooking } from "../../../hooks/configuracoes/useRecurringBookings"

interface Props {
  recurring: RecurringNoDia | null
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

const DIAS = ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"]

export function ModalDetalhesRecurring({ recurring, isOpen, onOpenChange, onSuccess }: Props) {
  const { remover, loading } = useRemoverRecurringBooking()

  if (!recurring) return null

  const horaInicio = recurring.booking_start.split("T")[1]?.slice(0, 5) ?? ""
  const horaFim = recurring.booking_end.split("T")[1]?.slice(0, 5) ?? ""
  const diaSemana = DIAS[new Date(recurring.booking_start).getDay()]

  async function handleRemover(onClose: () => void) {
    const ok = await remover(recurring!.id)
    if (ok) {
      onSuccess()
      onClose()
    }
  }

  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange} placement="center"
      classNames={{
        wrapper: 'px-4',
        closeButton: 'text-white hover:bg-white/40 cursor-pointer p-1',
      }}
    >
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex justify-center items-center gradient-background text-white rounded-t-xl gap-2">
              <HugeiconsIcon icon={RepeatIcon} size={20} />
              Agendamento Fixo
            </ModalHeader>

            <ModalBody className="flex flex-col gap-y-3 mt-3">
              <div className="flex gap-x-2 items-center">
                <HugeiconsIcon icon={UserCircleIcon} size={22} />
                <div>
                  <p className="font-semibold text-sm">{recurring.usuario.fullname}</p>
                  <p className="text-xs text-gray-500">{recurring.usuario.phone}</p>
                </div>
              </div>

              <div className="flex gap-x-2 items-center">
                <HugeiconsIcon icon={MapPinCheckIcon} size={22} />
                <div>
                  <p className="text-sm">{recurring.quadra.name}</p>
                  <p className="text-xs text-gray-500">{recurring.esporte.name}</p>
                </div>
              </div>

              <div className="flex gap-x-2 items-center">
                <HugeiconsIcon icon={RepeatIcon} size={22} />
                <div>
                  <p className="text-sm">Toda {diaSemana}</p>
                  <p className="text-xs text-gray-500">{horaInicio} – {horaFim}</p>
                  {recurring.valid_until && (
                    <p className="text-xs text-gray-400">Até {recurring.valid_until.split("-").reverse().join("/")}</p>
                  )}
                </div>
              </div>

              <p className="text-sm font-semibold text-right">
                {Number(recurring.price).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </p>
            </ModalBody>

            <ModalFooter className="flex justify-center">
              <button onClick={onClose} className="cancel-button">Fechar</button>
              <button
                className="confirm-button bg-red-500 border-red-500 disabled:opacity-50"
                disabled={loading}
                onClick={() => handleRemover(onClose)}
              >
                {loading ? "Removendo..." : "Remover Fixo"}
              </button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  )
}
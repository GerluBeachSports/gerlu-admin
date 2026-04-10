import { useState, useEffect } from 'react'
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Select,
  SelectItem,
} from '@heroui/react'
import { HugeiconsIcon } from '@hugeicons/react'
import { FootballIcon, TennisBallIcon, VolleyballIcon, DashedLineCircleIcon, Circle, BadmintonShuttleIcon, WorkoutStretchingIcon } from '@hugeicons/core-free-icons'

import {
  useEditarRecurringBooking,
  type RecurringBooking,
  type EditarRecurringBooking,
} from '../../../hooks/configuracoes/useRecurringBookings'

const DIAS_COMPLETOS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']
 
const HORARIOS = Array.from({ length: 24 }, (_, h) => {
  const label = `${String(h).padStart(2, '0')}:00`
  return { label, value: `${label}:00` }
})
 
const ICONE_ESPORTE: Record<string, any> = {
  'Funcional na areia': WorkoutStretchingIcon,
  'Queimada': Circle,
  'Peteca': BadmintonShuttleIcon,
  'Futvôlei': FootballIcon,
  'Beach Tennis': TennisBallIcon,
  'Vôlei': VolleyballIcon,
}
 
function getIconeEsporte(nome: string) {
  return ICONE_ESPORTE[nome] ?? DashedLineCircleIcon
}

const inputBase = 'w-full bg-lightblue rounded-xl px-4 py-3 text-sm focus:outline-none placeholder:text-gray-400'

const selectClass = {
  trigger: 'bg-lightblue rounded-xl px-3 h-10 shadow-none border-none data-[hover=true]:bg-lightblue/80',
  value: 'text-sm',
  popoverContent: 'rounded-xl shadow-lg border border-gray-100',
  listboxWrapper: 'max-h-48',
}

interface ModalEditarRecurringBookingProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  booking: RecurringBooking | null
  onSuccess: () => void
}

export function ModalEditarRecurringBooking({
  isOpen,
  onOpenChange,
  booking,
  onSuccess,
}: ModalEditarRecurringBookingProps) {
  const { editar, loading } = useEditarRecurringBooking()

  const [form, setForm] = useState<EditarRecurringBooking>({
    start_time: '08:00:00',
    end_time: '09:00:00',
    price: 0,
    valid_until: null,
  })

  const [priceInput, setPriceInput] = useState('')
  const [erro, setErro] = useState<string | null>(null)

  // Resetar/preencher formulário quando o modal abrir com um booking
  useEffect(() => {
    if (isOpen && booking) {
      setForm({
        start_time: booking.start_time,
        end_time: booking.end_time,
        price: booking.price,
        valid_until: booking.valid_until ?? null,
      })
      setPriceInput(String(booking.price).replace('.', ','))
      setErro(null)
    }
  }, [isOpen, booking])

  function handleSalvar(onClose: () => void) {
    setErro(null)

    if (form.start_time >= form.end_time) {
      return setErro('Horário de início deve ser anterior ao fim.')
    }

    const priceNum = parseFloat(priceInput.replace(',', '.'))
    if (isNaN(priceNum) || priceNum <= 0) {
      return setErro('Informe um valor válido.')
    }

    editar(booking!.id, { ...form, price: priceNum }).then((ok) => {
      if (!ok) {
        setErro('Erro ao salvar. Tente novamente.')
        return
      }
      onSuccess()
      onClose()
    })
  }

  if (!booking) return null

  const esporteNome = booking.court_sport?.sport?.name ?? '—'
  const quadraNome = booking.court_sport?.court?.name ?? '—'
  const IconeEsporte = getIconeEsporte(esporteNome)

  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      placement="center"
      classNames={{
        wrapper: 'px-4 !overflow-hidden',
        closeButton: 'text-white hover:bg-white/40 cursor-pointer p-1',
        base: 'max-h-[90vh] my-auto',
      }}
      scrollBehavior="inside"
      className="rounded-t-xl"
    >
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex justify-center gradient-background text-white rounded-t-xl">
              Editar Fixo · {quadraNome}
            </ModalHeader>

            <ModalBody className="flex flex-col gap-y-4 mt-3">
              {/* Informações somente leitura */}
              <div className="flex items-center gap-2 bg-lightblue rounded-xl px-4 py-3 flex-wrap">
                <HugeiconsIcon icon={IconeEsporte} size={15} className="text-brand" />
                <span className="text-sm text-gray-600">{esporteNome}</span>
                <span className="text-gray-300 mx-1">·</span>
                <span className="text-sm font-medium text-gray-700">
                  {DIAS_COMPLETOS[booking.day_of_week]}
                </span>
                <span className="text-gray-300 mx-1">·</span>
                <span className="text-sm text-gray-600">
                  {booking.user?.fullname ?? '—'}
                </span>
              </div>

              {/* Horários */}
              <div className="flex flex-col gap-y-1">
                <p className="text-xs text-gray-400 px-1">Horário</p>
                <div className="grid grid-cols-2 gap-3">
                  <Select
                    aria-label="Início"
                    selectedKeys={new Set([form.start_time])}
                    onSelectionChange={(keys) =>
                      setForm((p) => ({ ...p, start_time: Array.from(keys)[0] as string }))
                    }
                    classNames={selectClass}
                  >
                    {HORARIOS.map((h) => (
                      <SelectItem key={h.value}>{h.label}</SelectItem>
                    ))}
                  </Select>

                  <Select
                    aria-label="Fim"
                    selectedKeys={new Set([form.end_time])}
                    onSelectionChange={(keys) =>
                      setForm((p) => ({ ...p, end_time: Array.from(keys)[0] as string }))
                    }
                    classNames={selectClass}
                  >
                    {HORARIOS.map((h) => (
                      <SelectItem key={h.value}>{h.label}</SelectItem>
                    ))}
                  </Select>
                </div>
              </div>

              {/* Valor */}
              <div className="flex flex-col gap-y-1">
                <p className="text-xs text-gray-400 px-1">Valor</p>
                <div className="flex items-center bg-lightblue rounded-xl px-4 h-10 gap-2">
                  <span className="text-sm text-gray-400 shrink-0">R$</span>
                  <input
                    className="flex-1 bg-transparent text-sm focus:outline-none placeholder:text-gray-400"
                    placeholder="Valor"
                    value={priceInput}
                    onChange={(e) => setPriceInput(e.target.value)}
                  />
                </div>
              </div>

              {/* Fim de vigência */}
              <div className="flex flex-col gap-y-1">
                <p className="text-xs text-gray-400 px-1">Fim de vigência (opcional)</p>
                <input
                  type="date"
                  className={`${inputBase} py-2`}
                  value={form.valid_until ?? ''}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, valid_until: e.target.value || null }))
                  }
                />
              </div>

              {erro && <p className="text-red-500 text-xs text-center">{erro}</p>}
            </ModalBody>

            <ModalFooter className="flex justify-center">
              <button onClick={onClose} className="cancel-button">
                Cancelar
              </button>
              <button
                className="confirm-button disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={loading}
                onClick={() => handleSalvar(onClose)}
              >
                {loading ? 'Salvando...' : 'Salvar'}
              </button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  )
}
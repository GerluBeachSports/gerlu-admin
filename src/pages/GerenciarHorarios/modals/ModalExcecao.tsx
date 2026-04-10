import { useEffect, useState } from 'react'
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Select, SelectItem } from '@heroui/react'
import { HugeiconsIcon } from '@hugeicons/react'
import { Delete02Icon } from '@hugeicons/core-free-icons'
import { CalendarDate, parseDate, getLocalTimeZone, today } from '@internationalized/date'
import { Calendar } from '@heroui/react'
import { type Excecao } from '../../../hooks/configuracoes/useGerenciarHorarios'

interface Props {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  courtId: string
  excecao?: Excecao | null   // null = nova
  onSalvar: (courtId: string, dados: {
    id?: string
    date: string
    open_time: string | null
    close_time: string | null
    open_time_2: string | null
    close_time_2: string | null
    reason: string | null
  }) => Promise<boolean>
}

type Modo = 'fechado' | 'customizado'

const HORARIOS = Array.from({ length: 24 }, (_, h) => {
  const label = `${String(h).padStart(2, '0')}:00`
  return { label, value: `${label}:00` }
})

const selectClass = {
  trigger: 'bg-lightblue rounded-xl px-4 h-11 shadow-none border-none data-[hover=true]:bg-lightblue/80',
  value: 'text-sm',
  popoverContent: 'rounded-xl shadow-lg border border-gray-100',
  listboxWrapper: 'max-h-48',
}

export function ModalExcecao({ isOpen, onOpenChange, courtId, excecao, onSalvar }: Props) {
  const hoje = today(getLocalTimeZone())

  const [data, setData]           = useState<CalendarDate>(hoje)
  const [modo, setModo]           = useState<Modo>('fechado')
  const [openTime, setOpenTime]   = useState('06:00:00')
  const [closeTime, setCloseTime] = useState('22:00:00')
  const [segundoIntervalo, setSegundoIntervalo] = useState(false)
  const [openTime2, setOpenTime2]   = useState('06:00:00')
  const [closeTime2, setCloseTime2] = useState('22:00:00')
  const [reason, setReason]   = useState('')
  const [saving, setSaving]   = useState(false)
  const [erro, setErro]       = useState<string | null>(null)

  useEffect(() => {
    if (excecao) {
      setData(parseDate(excecao.date))
      if (!excecao.open_time) {
        setModo('fechado')
      } else {
        setModo('customizado')
        setOpenTime(excecao.open_time)
        setCloseTime(excecao.close_time ?? '22:00:00')
        if (excecao.open_time_2) {
          setSegundoIntervalo(true)
          setOpenTime2(excecao.open_time_2)
          setCloseTime2(excecao.close_time_2 ?? '22:00:00')
        }
      }
      setReason(excecao.reason ?? '')
    } else {
      setData(hoje)
      setModo('fechado')
      setOpenTime('08:00:00')
      setCloseTime('22:00:00')
      setSegundoIntervalo(false)
      setReason('')
    }
    setErro(null)
  }, [excecao, isOpen])

  async function handleSalvar(onClose: () => void) {
    setErro(null)

    if (modo === 'customizado') {
      if (openTime >= closeTime) {
        setErro('1º intervalo: abertura deve ser anterior ao fechamento.')
        return
      }
      if (segundoIntervalo) {
        if (openTime2 >= closeTime2) {
          setErro('2º intervalo: abertura deve ser anterior ao fechamento.')
          return
        }
        if (openTime2 <= closeTime) {
          setErro('2º intervalo deve começar após o fechamento do 1º.')
          return
        }
      }
    }

    const jsDate = data.toDate(getLocalTimeZone())
    const dateStr = `${jsDate.getFullYear()}-${String(jsDate.getMonth() + 1).padStart(2, '0')}-${String(jsDate.getDate()).padStart(2, '0')}`

    setSaving(true)
    const ok = await onSalvar(courtId, {
      id: excecao?.id,
      date: dateStr,
      open_time:    modo === 'customizado' ? openTime  : null,
      close_time:   modo === 'customizado' ? closeTime : null,
      open_time_2:  modo === 'customizado' && segundoIntervalo ? openTime2  : null,
      close_time_2: modo === 'customizado' && segundoIntervalo ? closeTime2 : null,
      reason: reason || null,
    })
    setSaving(false)

    if (ok) onClose()
    else setErro('Erro ao salvar. Verifique se já existe uma exceção para esta data.')
  }

  const isEdicao = !!excecao

  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      placement="center"
      scrollBehavior="inside"
      classNames={{
        wrapper: 'px-4 !overflow-hidden',
        closeButton: 'text-white hover:bg-white/40 cursor-pointer p-1',
        base: 'max-h-[90vh] my-auto',
      }}
      className='rounded-t-xl'
    >
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex justify-center gradient-background text-white rounded-t-xl">
              {isEdicao ? 'Editar Exceção' : 'Nova Exceção'}
            </ModalHeader>

            <ModalBody className="flex flex-col gap-y-4 mt-3">

              {/* Data */}
              {!isEdicao && (
                <div className="flex flex-col gap-y-1">
                  <p className="text-xs text-gray-500 px-1">Data</p>
                  <div className="flex justify-center bg-lightblue rounded-xl p-3">
                    <Calendar
                      aria-label="Data da exceção"
                      value={data}
                      onChange={setData}
                      minValue={hoje}
                      focusedValue={data}
                      onFocusChange={(d) => { if (d) setData(d) }}
                      classNames={{
                        cellButton: 'data-[selected=true]:bg-brand data-[selected=true]:text-white',
                      }}
                    />
                  </div>
                </div>
              )}

              {isEdicao && (
                <div className="bg-lightblue rounded-xl px-4 py-3">
                  <p className="text-sm font-medium">
                    {new Date(excecao!.date + 'T12:00:00').toLocaleDateString('pt-BR', {
                      weekday: 'long', day: '2-digit', month: 'long', year: 'numeric'
                    })}
                  </p>
                </div>
              )}

              {/* Modo */}
              <div className="flex gap-2">
                {([
                  { value: 'fechado',     label: 'Fechado'       },
                  { value: 'customizado', label: 'Personalizado' },
                ] as { value: Modo; label: string }[]).map(op => (
                  <button
                    key={op.value}
                    onClick={() => setModo(op.value)}
                    className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer
                      ${modo === op.value
                        ? op.value === 'fechado' ? 'bg-red-500 text-white' : 'bg-brand text-white'
                        : 'bg-lightblue text-gray-600 hover:bg-lightblue/70'
                      }`}
                  >
                    {op.label}
                  </button>
                ))}
              </div>

              {/* Intervalos */}
              {modo === 'customizado' && (
                <div className="flex flex-col gap-y-3">
                  <div className="flex flex-col gap-y-1">
                    <p className="text-xs text-gray-400 px-1">1º intervalo</p>
                    <div className="flex gap-3">
                      <div className="flex-1 flex flex-col gap-y-1">
                        <p className="text-xs text-gray-500 px-1">Abre</p>
                        <Select aria-label="Abre" selectedKeys={new Set([openTime])}
                          onSelectionChange={k => setOpenTime(Array.from(k)[0] as string)} classNames={selectClass}>
                          {HORARIOS.map(h => <SelectItem key={h.value}>{h.label}</SelectItem>)}
                        </Select>
                      </div>
                      <div className="flex-1 flex flex-col gap-y-1">
                        <p className="text-xs text-gray-500 px-1">Fecha</p>
                        <Select aria-label="Fecha" selectedKeys={new Set([closeTime])}
                          onSelectionChange={k => setCloseTime(Array.from(k)[0] as string)} classNames={selectClass}>
                          {HORARIOS.map(h => <SelectItem key={h.value}>{h.label}</SelectItem>)}
                        </Select>
                      </div>
                    </div>
                  </div>

                  {segundoIntervalo ? (
                    <div className="flex flex-col gap-y-1">
                      <div className="flex items-center justify-between px-1">
                        <p className="text-xs text-gray-400">2º intervalo</p>
                        <button onClick={() => setSegundoIntervalo(false)}
                          className="text-gray-400 hover:text-red-500 transition-colors cursor-pointer">
                          <HugeiconsIcon icon={Delete02Icon} size={14} />
                        </button>
                      </div>
                      <div className="flex gap-3">
                        <div className="flex-1 flex flex-col gap-y-1">
                          <p className="text-xs text-gray-500 px-1">Abre</p>
                          <Select aria-label="Abre 2" selectedKeys={new Set([openTime2])}
                            onSelectionChange={k => setOpenTime2(Array.from(k)[0] as string)} classNames={selectClass}>
                            {HORARIOS.map(h => <SelectItem key={h.value}>{h.label}</SelectItem>)}
                          </Select>
                        </div>
                        <div className="flex-1 flex flex-col gap-y-1">
                          <p className="text-xs text-gray-500 px-1">Fecha</p>
                          <Select aria-label="Fecha 2" selectedKeys={new Set([closeTime2])}
                            onSelectionChange={k => setCloseTime2(Array.from(k)[0] as string)} classNames={selectClass}>
                            {HORARIOS.map(h => <SelectItem key={h.value}>{h.label}</SelectItem>)}
                          </Select>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => { setSegundoIntervalo(true); setOpenTime2(closeTime) }}
                      className="text-sm text-brand font-medium text-left px-1 cursor-pointer hover:underline"
                    >
                      + Adicionar 2º intervalo
                    </button>
                  )}
                </div>
              )}

              {/* Motivo */}
              <input
                className="w-full bg-lightblue rounded-xl px-4 py-3 text-sm focus:outline-none placeholder:text-gray-400"
                placeholder="Motivo (opcional, ex: Feriado, Manutenção)"
                value={reason}
                onChange={e => setReason(e.target.value)}
              />

              {erro && <p className="text-red-500 text-sm text-center">{erro}</p>}
            </ModalBody>

            <ModalFooter className="flex justify-center">
              <button onClick={onClose} className="cancel-button">Cancelar</button>
              <button
                className="confirm-button disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={saving}
                onClick={() => handleSalvar(onClose)}
              >
                {saving ? 'Salvando...' : 'Salvar'}
              </button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  )
}
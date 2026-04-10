import { useEffect, useState } from 'react'
import {
  Modal, ModalContent, ModalHeader, ModalBody, ModalFooter,
  Select, SelectItem,
} from '@heroui/react'
import { HugeiconsIcon } from '@hugeicons/react'
import { Delete02Icon } from '@hugeicons/core-free-icons'
import { CalendarDate, getLocalTimeZone } from '@internationalized/date'
import { useQuadras } from '../../../hooks/agendamentos/useQuadras'
import { useDisponibilidadeDia } from '../../../hooks/agendamentos/useDisponibilidadeDia'

interface Props {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  dataSelecionada: CalendarDate
}

const HORARIOS = Array.from({ length: 24 }, (_, h) => {
  const label = `${String(h).padStart(2, '0')}:00`
  return { label, value: `${label}:00` }
})

type Modo = 'padrao' | 'fechado' | 'customizado'

const selectClass = {
  trigger: 'bg-lightblue rounded-xl px-4 h-11 shadow-none border-none data-[hover=true]:bg-lightblue/80',
  value: 'text-sm',
  popoverContent: 'rounded-xl shadow-lg border border-gray-100',
  listboxWrapper: 'max-h-48',
}

function formatarHorario(time: string | null): string {
  if (!time) return '—'
  return time.slice(0, 5)
}

function SelectHorario({ label, value, onChange }: {
  label: string
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div className="flex-1 flex flex-col gap-y-1">
      <p className="text-xs text-gray-500 px-1">{label}</p>
      <Select
        aria-label={label}
        selectedKeys={new Set([value])}
        onSelectionChange={(keys) => onChange(Array.from(keys)[0] as string)}
        classNames={selectClass}
      >
        {HORARIOS.map(h => (
          <SelectItem key={h.value}>{h.label}</SelectItem>
        ))}
      </Select>
    </div>
  )
}

export function ModalDisponibilidade({ isOpen, onOpenChange, dataSelecionada }: Props) {
  const { quadras } = useQuadras()
  const [courtIds, setCourtIds] = useState<string[]>([])

  const { gradePadrao, excecoes, loading, salvarTodas } =
    useDisponibilidadeDia(courtIds, dataSelecionada)

  const [modo, setModo] = useState<Modo>('padrao')
  const [openTime, setOpenTime]   = useState('08:00:00')
  const [closeTime, setCloseTime] = useState('22:00:00')
  const [segundoIntervalo, setSegundoIntervalo] = useState(false)
  const [openTime2, setOpenTime2]   = useState('08:00:00')
  const [closeTime2, setCloseTime2] = useState('22:00:00')
  const [reason, setReason]   = useState('')
  const [saving, setSaving]   = useState(false)
  const [erro, setErro]       = useState<string | null>(null)

  // Sincroniza estado quando carrega dados (só quando uma quadra selecionada)
  useEffect(() => {
    if (loading || courtIds.length !== 1) return

    const excecao = excecoes[courtIds[0]]

    if (excecao) {
      if (!excecao.open_time) {
        setModo('fechado')
        setReason(excecao.reason ?? '')
      } else {
        setModo('customizado')
        setOpenTime(excecao.open_time)
        setCloseTime(excecao.close_time ?? '22:00:00')
        setReason(excecao.reason ?? '')
        if (excecao.open_time_2) {
          setSegundoIntervalo(true)
          setOpenTime2(excecao.open_time_2)
          setCloseTime2(excecao.close_time_2 ?? '22:00:00')
        } else {
          setSegundoIntervalo(false)
        }
      }
    } else {
      setModo('padrao')
      setSegundoIntervalo(false)
    }
  }, [excecoes, loading])

  function handleOpenChange(open: boolean) {
    if (!open) {
      setCourtIds([])
      setModo('padrao')
      setSegundoIntervalo(false)
      setReason('')
      setErro(null)
    }
    onOpenChange(open)
  }

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

    setSaving(true)
    const ok = await salvarTodas({
      modo,
      open_time:    modo === 'customizado' ? openTime  : null,
      close_time:   modo === 'customizado' ? closeTime : null,
      open_time_2:  modo === 'customizado' && segundoIntervalo ? openTime2  : null,
      close_time_2: modo === 'customizado' && segundoIntervalo ? closeTime2 : null,
      reason: (modo !== 'padrao' && reason) ? reason : null,
    })
    setSaving(false)

    if (ok) onClose()
    else setErro('Erro ao salvar. Tente novamente.')
  }

  const jsDate = dataSelecionada.toDate(getLocalTimeZone())
  const dataFormatada = jsDate.toLocaleDateString('pt-BR', {
    weekday: 'long', day: '2-digit', month: 'long',
  })

  // Resumo das grades padrão das quadras selecionadas
  const resumoGrades = courtIds.map(id => {
    const quadra = quadras.find(q => q.id === id)
    const grade  = gradePadrao[id]
    return {
      nome: quadra?.name ?? '—',
      grade: grade
        ? `${formatarHorario(grade.open_time)} – ${formatarHorario(grade.close_time)}`
        : 'Sem grade padrão',
    }
  })

  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={handleOpenChange}
      placement="center"
      classNames={{
        wrapper: 'px-4 !overflow-hidden',
        closeButton: 'text-white hover:bg-white/40 cursor-pointer p-1',
        base: 'max-h-[90vh] my-auto',
      }}
      scrollBehavior="inside"
      className='rounded-t-xl'
    >
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex justify-center gradient-background text-white rounded-t-xl">
              Ajustar Disponibilidade
            </ModalHeader>

            <ModalBody className="flex flex-col gap-y-4 mt-3">

              {/* Data (somente leitura) */}
              <div className="bg-lightblue rounded-xl px-4 py-3">
                <p className="text-sm capitalize">{dataFormatada}</p>
              </div>

              {/* Multiselect de quadras */}
              <Select
                placeholder="Selecionar Quadra(s)"
                aria-label="Quadras"
                selectionMode="multiple"
                selectedKeys={new Set(courtIds)}
                onSelectionChange={(keys) => setCourtIds(Array.from(keys) as string[])}
                classNames={selectClass}
              >
                {quadras.map(q => (
                  <SelectItem key={q.id}>{q.name}</SelectItem>
                ))}
              </Select>

              {/* Conteúdo condicional */}
              {courtIds.length > 0 && !loading && (
                <>
                  {/* Grades padrão */}
                  <div className="flex flex-col gap-y-1.5">
                    {resumoGrades.map(({ nome, grade }) => (
                      <div key={nome} className="bg-lightblue rounded-xl px-4 py-2.5 flex items-center justify-between">
                        <p className="text-xs text-gray-500">{nome}</p>
                        <p className="text-xs font-medium">{grade}</p>
                      </div>
                    ))}
                  </div>

                  {/* Seleção de modo */}
                  <div className="flex flex-col gap-y-1">
                    <p className="text-xs text-gray-500 px-1">Exceção para este dia</p>
                    <div className="flex gap-2">
                      {([
                        { value: 'padrao',      label: 'Padrão'       },
                        { value: 'fechado',     label: 'Fechado'      },
                        { value: 'customizado', label: 'Personalizado' },
                      ] as { value: Modo; label: string }[]).map(op => (
                        <button
                          key={op.value}
                          onClick={() => setModo(op.value)}
                          className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer
                            ${modo === op.value
                              ? op.value === 'fechado'
                                ? 'bg-red-500 text-white'
                                : 'bg-brand text-white'
                              : 'bg-lightblue text-gray-600 hover:bg-lightblue/70'
                            }`}
                        >
                          {op.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Modo Personalizado */}
                  {modo === 'customizado' && (
                    <div className="flex flex-col gap-y-3">

                      {/* 1º intervalo */}
                      <div className="flex flex-col gap-y-1">
                        <p className="text-xs text-gray-400 px-1">1º intervalo</p>
                        <div className="flex gap-3">
                          <SelectHorario label="Abre"  value={openTime}  onChange={setOpenTime}  />
                          <SelectHorario label="Fecha" value={closeTime} onChange={setCloseTime} />
                        </div>
                      </div>

                      {/* 2º intervalo */}
                      {segundoIntervalo ? (
                        <div className="flex flex-col gap-y-1">
                          <div className="flex items-center justify-between px-1">
                            <p className="text-xs text-gray-400">2º intervalo</p>
                            <button
                              onClick={() => setSegundoIntervalo(false)}
                              className="text-gray-400 hover:text-red-500 transition-colors cursor-pointer"
                            >
                              <HugeiconsIcon icon={Delete02Icon} size={14} />
                            </button>
                          </div>
                          <div className="flex gap-3">
                            <SelectHorario label="Abre"  value={openTime2}  onChange={setOpenTime2}  />
                            <SelectHorario label="Fecha" value={closeTime2} onChange={setCloseTime2} />
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => { setSegundoIntervalo(true); setOpenTime2(closeTime); }}
                          className="text-sm text-brand font-medium text-left px-1 cursor-pointer hover:underline"
                        >
                          + Adicionar 2º intervalo
                        </button>
                      )}
                    </div>
                  )}

                  {/* Motivo */}
                  {(modo === 'fechado' || modo === 'customizado') && (
                    <input
                      className="w-full bg-lightblue rounded-xl px-4 py-3 text-sm focus:outline-none placeholder:text-gray-400"
                      placeholder="Motivo (opcional, ex: Feriado, Manutenção)"
                      value={reason}
                      onChange={e => setReason(e.target.value)}
                    />
                  )}

                  {/* Aviso modo Padrão */}
                  {modo === 'padrao' && (
                    <p className="text-xs text-center text-gray-400">
                      {courtIds.some(id => excecoes[id])
                        ? 'As exceções existentes serão removidas e os dias voltarão à grade padrão.'
                        : 'Nenhuma exceção cadastrada. Os dias seguem a grade padrão.'
                      }
                    </p>
                  )}

                  {/* Aviso múltiplas quadras */}
                  {courtIds.length > 1 && modo !== 'padrao' && (
                    <p className="text-xs text-center text-amber-500">
                      A mesma configuração será aplicada para todas as {courtIds.length} quadras selecionadas.
                    </p>
                  )}
                </>
              )}

              {courtIds.length > 0 && loading && (
                <p className="text-sm text-gray-400 animate-pulse text-center">Carregando...</p>
              )}

              {erro && <p className="text-red-500 text-sm text-center">{erro}</p>}
            </ModalBody>

            <ModalFooter className="flex justify-center">
              <button onClick={onClose} className="cancel-button">Cancelar</button>
              <button
                className="confirm-button disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={courtIds.length === 0 || saving}
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
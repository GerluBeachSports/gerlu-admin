import { useState } from 'react'
import {
  Modal, ModalContent, ModalHeader, ModalBody, ModalFooter,
  Input, Select, SelectItem, Calendar,
} from "@heroui/react"
import { CalendarDate, today, getLocalTimeZone } from "@internationalized/date"
import { useQuadras } from "../../../hooks/agendamentos/useQuadras"
import { useEsportesPorQuadra } from "../../../hooks/agendamentos/useEsportesPorQuadra"
import { useHorariosDisponiveis } from "../../../hooks/agendamentos/useHorariosDisponiveis"
import { ModalConfirmarAgendamento, type DadosConfirmacao } from "./ModalConfirmarAgendamento"

interface Props {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

function aplicarMascaraTelefone(valor: string): string {
  const nums = valor.replace(/\D/g, '').slice(0, 11)
  if (nums.length <= 2) return `(${nums}`
  if (nums.length <= 7) return `(${nums.slice(0, 2)}) ${nums.slice(2)}`
  return `(${nums.slice(0, 2)}) ${nums.slice(2, 7)}-${nums.slice(7)}`
}

const inputClass = {
  innerWrapper: "flex items-center gap-2 bg-lightblue py-3 px-4 rounded-xl",
  input: "text-sm focus:outline-none border-transparent focus:border-transparent focus:ring-0",
  inputWrapper: "p-0",
}

const selectClass = {
  trigger: "bg-lightblue rounded-xl px-4 h-12 shadow-none border-none data-[hover=true]:bg-lightblue/80",
  value: "text-sm",
  popoverContent: "rounded-xl shadow-lg border border-gray-100",
}

export function ModalNovoAgendamento({ isOpen, onOpenChange, onSuccess }: Props) {
  const [fullname, setFullname] = useState('')
  const [telefone, setTelefone] = useState('')
  const [quadraId, setQuadraId] = useState<string | null>(null)
  const [courtSportId, setCourtSportId] = useState<string | null>(null)
  const [dataSelecionada, setDataSelecionada] = useState<CalendarDate | null>(null)
  const [horario, setHorario] = useState<string | null>(null)

  const [confirmacaoAberta, setConfirmacaoAberta] = useState(false)
  const [dadosConfirmacao, setDadosConfirmacao] = useState<DadosConfirmacao | null>(null)

  const { quadras } = useQuadras()
  const { esportes } = useEsportesPorQuadra(quadraId, {
    excluirEsportes: ['Funcional na areia'],
  })
  const { horarios } = useHorariosDisponiveis(courtSportId, dataSelecionada)

  const quadraSelecionada = quadras.find(q => q.id === quadraId)
  const esporteSelecionado = esportes.find(e => e.court_sport_id === courtSportId)

  // Preço e duração vêm do slot selecionado, não mais da quadra
  const slotSelecionado = horarios.find(h => h.value === horario) ?? null

  const phoneNumeros = telefone.replace(/\D/g, '')
  const telefoneValido = phoneNumeros.length === 11 && phoneNumeros[2] === '9'

  const podeSalvar =
    fullname.trim() &&
    telefoneValido &&
    courtSportId &&
    dataSelecionada &&
    horario &&
    slotSelecionado !== null

  function resetar() {
    setFullname('')
    setTelefone('')
    setQuadraId(null)
    setCourtSportId(null)
    setDataSelecionada(null)
    setHorario(null)
  }

  function handleAbrirConfirmacao(onClose: () => void) {
    if (!podeSalvar || !slotSelecionado) return

    setDadosConfirmacao({
      fullname,
      phone: phoneNumeros,
      telefoneFormatado: telefone,
      court_sport_id: courtSportId!,
      horario: horario!,
      slotDurationMinutes: slotSelecionado.slotDurationMinutes,
      price: slotSelecionado.price,
      quadraNome: quadraSelecionada?.name ?? '—',
      quadraImageUrl: quadraSelecionada?.image_url ?? null,
      esporteNome: esporteSelecionado?.sport_name ?? '—',
    })

    onClose()
    setConfirmacaoAberta(true)
  }

  function handleVoltarParaFormulario() {
    setConfirmacaoAberta(false)
    onOpenChange(true)
  }

  function handleConfirmacaoSuccess() {
    setConfirmacaoAberta(false)
    resetar()
    onSuccess?.()
  }

  const hoje = today(getLocalTimeZone())
  const maxDate = hoje.add({ days: 59 })

  const turnoInfo: Record<string, { label: string; className: string }> = {}
  horarios.forEach(h => {
    const hora = parseInt(h.label.split(':')[0])
    if (hora >= 18)
      turnoInfo[h.value] = { label: 'Noite', className: 'bg-night/15 text-night' }
    else if (hora >= 13)
      turnoInfo[h.value] = { label: 'Tarde', className: 'bg-afternoon/15 text-afternoon' }
    else
      turnoInfo[h.value] = { label: 'Manhã', className: 'bg-morning/15 text-morning' }
  })

  function formatarDuracao(minutos: number): string {
    if (minutos < 120) return `${minutos}min`
    return `${minutos / 60}h`
  }

  function formatarPreco(price: number): string {
    return price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  }

  return (
    <>
      <Modal
        isOpen={isOpen}
        onOpenChange={(open) => { if (!open) resetar(); onOpenChange(open) }}
        placement="center"
        scrollBehavior="inside"
        classNames={{
          wrapper: "px-4 !overflow-hidden",
          closeButton: "text-white hover:bg-white/40 cursor-pointer p-1",
          base: "max-h-[90vh] my-auto",
        }}
        className="rounded-t-xl"
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex justify-center gradient-background text-white rounded-t-xl">
                Novo Agendamento
              </ModalHeader>

              <ModalBody className="flex flex-col gap-y-3 mt-3 overflow-y-auto">

                {/* Nome */}
                <Input
                  placeholder="Nome Completo"
                  aria-label="Nome Completo"
                  value={fullname}
                  onValueChange={setFullname}
                  classNames={inputClass}
                />

                {/* Telefone */}
                <Input
                  placeholder="(XX) 9XXXX-XXXX"
                  aria-label="Telefone"
                  value={telefone}
                  onValueChange={(v) => setTelefone(aplicarMascaraTelefone(v))}
                  isInvalid={telefone.length > 0 && !telefoneValido}
                  errorMessage="Telefone inválido"
                  classNames={inputClass}
                />

                {/* Quadra */}
                <Select
                  placeholder="Selecionar Quadra"
                  aria-label="Quadra"
                  selectedKeys={quadraId ? new Set([quadraId]) : new Set()}
                  onSelectionChange={(keys) => {
                    const val = Array.from(keys)[0] as string ?? null
                    setQuadraId(val)
                    setCourtSportId(null)
                    setDataSelecionada(null)
                    setHorario(null)
                  }}
                  classNames={selectClass}
                >
                  {quadras.map(q => (
                    <SelectItem key={q.id}>{q.name}</SelectItem>
                  ))}
                </Select>

                {/* Esporte */}
                {quadraId && (
                  <Select
                    placeholder="Selecionar Esporte"
                    aria-label="Esporte"
                    selectedKeys={courtSportId ? new Set([courtSportId]) : new Set()}
                    onSelectionChange={(keys) => {
                      const val = Array.from(keys)[0] as string ?? null
                      setCourtSportId(val)
                      setDataSelecionada(null)
                      setHorario(null)
                    }}
                    classNames={selectClass}
                  >
                    {esportes.map(e => (
                      <SelectItem key={e.court_sport_id}>{e.sport_name}</SelectItem>
                    ))}
                  </Select>
                )}

                {/* Data — calendário inline */}
                {courtSportId && (
                  <div className="flex flex-col gap-y-1">
                    <p className="text-xs text-gray-500 px-1">Selecionar Data</p>
                    <div className="flex justify-center bg-lightblue rounded-xl p-3">
                      <Calendar
                        aria-label="Data do agendamento"
                        value={dataSelecionada}
                        onChange={(d) => { setDataSelecionada(d); setHorario(null) }}
                        minValue={hoje}
                        maxValue={maxDate}
                        focusedValue={dataSelecionada ?? hoje}
                        onFocusChange={(d) => { if (d) setDataSelecionada(d) }}
                        classNames={{
                          cellButton: `data-[selected=true]:bg-brand data-[selected=true]:text-white`,
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* Horários */}
                {dataSelecionada && (
                  <div className="flex flex-col gap-y-1">
                    <p className="text-xs text-gray-500 px-1">Selecionar Horário</p>

                    {horarios.length === 0 ? (
                      <p className="text-sm text-gray-400 text-center py-3">
                        Nenhum horário disponível para esta data.
                      </p>
                    ) : (
                      <Select
                        placeholder="Selecionar Horário"
                        aria-label="Horário"
                        selectedKeys={horario ? new Set([horario]) : new Set()}
                        onSelectionChange={(keys) => {
                          const val = Array.from(keys)[0] as string ?? null
                          setHorario(val)
                        }}
                        classNames={{
                          ...selectClass,
                          listboxWrapper: "max-h-48",
                          popoverContent: "rounded-xl shadow-lg border border-gray-100 p-1",
                        }}
                        renderValue={(items) => {
                          const item = items[0]
                          const h = horarios.find(h => h.value === item?.key)
                          if (!h) return null
                          return (
                            <span className="text-sm font-medium">
                              {h.label}
                              <span className="text-gray-400 font-normal ml-1.5">
                                · {formatarDuracao(h.slotDurationMinutes)} · {formatarPreco(h.price)}
                              </span>
                            </span>
                          )
                        }}
                      >
                        {horarios.map(h => (
                          <SelectItem
                            key={h.value}
                            textValue={h.label}
                            classNames={{
                              base: "rounded-lg px-3 py-2 data-[hover=true]:bg-lightblue",
                            }}
                          >
                            <div className="flex items-center justify-between w-full gap-2">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-sm">{h.label}</span>
                                <span className={`text-xs rounded-full px-2 py-0.5 font-medium ${turnoInfo[h.value]?.className}`}>
                                  {turnoInfo[h.value]?.label}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0">
                                <span className="text-xs text-gray-400">
                                  {formatarDuracao(h.slotDurationMinutes)}
                                </span>
                                <span className="text-gray-200">·</span>
                                <span className="text-xs font-semibold text-brand">
                                  {formatarPreco(h.price)}
                                </span>
                              </div>
                            </div>
                          </SelectItem>
                        ))}
                      </Select>
                    )}
                  </div>
                )}
              </ModalBody>

              <ModalFooter className="flex justify-center">
                <button onClick={onClose} className="cancel-button">Cancelar</button>
                <button
                  className="confirm-button disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={!podeSalvar}
                  onClick={() => handleAbrirConfirmacao(onClose)}
                >
                  Salvar
                </button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      <ModalConfirmarAgendamento
        isOpen={confirmacaoAberta}
        onOpenChange={setConfirmacaoAberta}
        dados={dadosConfirmacao}
        onVoltar={handleVoltarParaFormulario}
        onSuccess={handleConfirmacaoSuccess}
      />
    </>
  )
}
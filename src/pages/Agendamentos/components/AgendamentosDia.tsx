import { useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  SunCloud02Icon, Sun02Icon, Moon02Icon,
  CircleArrowLeft01Icon, CircleArrowRight01Icon,
  CalendarLock01Icon, UserCircleIcon, TennisBallIcon,
  FootballIcon, VolleyballIcon, BadmintonShuttleIcon,
  Circle, DashedLineCircleIcon, MapPinCheckIcon,
  RepeatIcon,
} from "@hugeicons/core-free-icons"
import { useDisclosure } from "@heroui/react"
import { CalendarDate, getLocalTimeZone } from "@internationalized/date"
import { type Agendamento, type Turno } from "../../../hooks/agendamentos/useAgendamentos"
import { type RecurringNoDia } from "../../../hooks/agendamentos/useRecurringNoMes"
import { ModalDetalhesAgendamento } from "../modals/ModalDetalhesAgendamento"
import { ModalDetalhesRecurring } from "../modals/ModalDetalhesRecurring"
import { ModalDisponibilidade } from "../modals/ModalDisponibilidade"

interface Props {
  dataSelecionada: CalendarDate
  setDataSelecionada: (data: CalendarDate) => void
  agendamentos: Agendamento[]
  recurringDoDia: RecurringNoDia[]
  loading: boolean
  error: string | null
  onRefetch: () => void
}

const DIAS_SEMANA = ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"]

const TURNOS: { turno: Turno; label: string; icon: any; className: string }[] = [
  { turno: 'morning', label: 'Manhã', icon: SunCloud02Icon, className: 'text-morning' },
  { turno: 'afternoon', label: 'Tarde', icon: Sun02Icon, className: 'text-afternoon' },
  { turno: 'night', label: 'Noite', icon: Moon02Icon, className: 'text-night' },
]

function getIconeEsporte(nomeEsporte: string) {
  switch (nomeEsporte) {
    case 'Queimada': return Circle
    case 'Peteca': return BadmintonShuttleIcon
    case 'Futvôlei': return FootballIcon
    case 'Beach Tennis': return TennisBallIcon
    case 'Vôlei': return VolleyballIcon
    default: return DashedLineCircleIcon
  }
}

function CardAgendamento({ ag, onClick }: { ag: Agendamento; onClick: (ag: Agendamento) => void }) {
  const hora = new Date(ag.booking_start).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  const iconeEsporte = getIconeEsporte(ag.esporte.name)

  return (
    <button className="card-day" onClick={() => onClick(ag)}>
      <div className="bg-brand rounded-t-2xl px-8 py-1.5 font-montserrat text-white">
        <p className="text-center">{hora}</p>
      </div>
      <div className="flex flex-col border-x-1 border-b-1 rounded-b-2xl border-brand justify-center py-2 px-1 gap-y-1">
        <div className="flex gap-x-2 items-center">
          <HugeiconsIcon icon={UserCircleIcon} size={24} />
          <p className="text-sm">{ag.usuario.fullname}</p>
        </div>
        <div className="flex gap-x-2 items-center">
          <HugeiconsIcon icon={MapPinCheckIcon} size={24} />
          <p className="text-sm">{ag.quadra.name}</p>
        </div>
        <div className="flex gap-x-2 items-center">
          <HugeiconsIcon icon={iconeEsporte} size={24} />
          <p className="text-sm">{ag.esporte.name}</p>
        </div>
      </div>
    </button>
  )
}

// Card diferenciado para recurring — header roxo/secundário e ícone de repetição
function CardRecurring({ rb, onClick }: { rb: RecurringNoDia; onClick: (rb: RecurringNoDia) => void }) {
  const hora = rb.booking_start.split("T")[1]?.slice(0, 5) ?? ""
  const iconeEsporte = getIconeEsporte(rb.esporte.name)

  return (
    <button className="card-day" onClick={() => onClick(rb)}>
      <div className="bg-brandsecondary rounded-t-2xl px-8 py-1.5 font-montserrat text-white flex items-center justify-center gap-1">
        <HugeiconsIcon icon={RepeatIcon} size={14} />
        <p className="text-center">{hora}</p>
      </div>
      <div className="flex flex-col border-x-1 border-b-1 rounded-b-2xl border-brandsecondary justify-center py-2 px-1 gap-y-1">
        <div className="flex gap-x-2 items-center">
          <HugeiconsIcon icon={UserCircleIcon} size={24} />
          <p className="text-sm">{rb.usuario.fullname}</p>
        </div>
        <div className="flex gap-x-2 items-center">
          <HugeiconsIcon icon={MapPinCheckIcon} size={24} />
          <p className="text-sm">{rb.quadra.name}</p>
        </div>
        <div className="flex gap-x-2 items-center">
          <HugeiconsIcon icon={iconeEsporte} size={24} />
          <p className="text-sm">{rb.esporte.name}</p>
        </div>
      </div>
    </button>
  )
}

export function AgendamentosDia({ dataSelecionada, setDataSelecionada, agendamentos, recurringDoDia, loading, error, onRefetch }: Props) {
  const jsDate = dataSelecionada.toDate(getLocalTimeZone())
  const diaSemana = DIAS_SEMANA[jsDate.getDay()]
  const dataFormatada = dataSelecionada.toString().split("-").reverse().join("/")

  const avancar = () => setDataSelecionada(dataSelecionada.add({ days: 1 }))
  const retroceder = () => setDataSelecionada(dataSelecionada.subtract({ days: 1 }))

  const detalhesModal = useDisclosure()
  const recurringModal = useDisclosure()
  const disponibilidadeModal = useDisclosure()
  const [agendamentoSelecionado, setAgendamentoSelecionado] = useState<Agendamento | null>(null)
  const [recurringSelecionado, setRecurringSelecionado] = useState<RecurringNoDia | null>(null)

  function handleCardClick(ag: Agendamento) {
    setAgendamentoSelecionado(ag)
    detalhesModal.onOpen()
  }

  function handleRecurringClick(rb: RecurringNoDia) {
    setRecurringSelecionado(rb)
    recurringModal.onOpen()
  }

  // Mescla e ordena avulsos + fixos por horário
  function getItensTurno(turno: Turno) {
    const avulsos = agendamentos.filter(a => a.turno === turno)
    const fixos = recurringDoDia.filter(r => r.turno === turno)
    return { avulsos, fixos }
  }

  return (
    <div className="w-full flex flex-col items-center md:block">
      <div className="flex flex-col items-center justify-center">
        <div className="grid grid-cols-[auto_1fr_auto] items-center gap-x-4">
          <button className="cursor-pointer" onClick={retroceder}>
            <HugeiconsIcon icon={CircleArrowLeft01Icon} />
          </button>
          <p className="font-montserrat font-bold text-brand text-center">
            {diaSemana}, {dataFormatada}
          </p>
          <button className="cursor-pointer" onClick={avancar}>
            <HugeiconsIcon icon={CircleArrowRight01Icon} />
          </button>
        </div>

        <button
          className="flex mt-2 gap-x-2 items-center cursor-pointer text-brandsecondary"
          onClick={disponibilidadeModal.onOpen}
        >
          <HugeiconsIcon icon={CalendarLock01Icon} size={20} />
          <p className="font-montserrat text-sm">Ajustar Disponibilidade</p>
        </button>
      </div>

      <div className="mt-6 md:ml-12 space-y-6">
        {loading && <p className="text-sm text-gray-400 animate-pulse">Carregando agendamentos...</p>}
        {error && <p className="text-sm text-red-500">{error}</p>}

        {!loading && !error && TURNOS.map(({ turno, label, icon, className }) => {
          const { avulsos, fixos } = getItensTurno(turno)
          const total = avulsos.length + fixos.length

          return (
            <section key={turno}>
              <div className={`flex text-sm items-center gap-x-2 ${className}`}>
                <HugeiconsIcon icon={icon} size={32} />
                <p className="font-montserrat font-semibold text-lg">{label}</p>
              </div>

              <div className="flex overflow-x-auto scrollbar-hide overflow-y-visible gap-x-4 py-3 px-3 md:px-1 pb-6 md:pb-2 md:grid md:grid-cols-6 md:gap-y-4 rounded-2xl">
                {total === 0 ? (
                  <p className="text-sm text-gray-400 col-span-6">Nenhum agendamento.</p>
                ) : (
                  <>
                    {fixos.map(rb => (
                      <CardRecurring key={`${rb.id}-${rb.booking_start}`} rb={rb} onClick={handleRecurringClick} />
                    ))}
                    {avulsos.map(ag => (
                      <CardAgendamento key={ag.id} ag={ag} onClick={handleCardClick} />
                    ))}
                  </>
                )}
              </div>
            </section>
          )
        })}
      </div>

      <ModalDetalhesAgendamento
        agendamento={agendamentoSelecionado}
        isOpen={detalhesModal.isOpen}
        onOpenChange={detalhesModal.onOpenChange}
        onCancelSuccess={onRefetch}
      />

      <ModalDetalhesRecurring
        recurring={recurringSelecionado}
        isOpen={recurringModal.isOpen}
        onOpenChange={recurringModal.onOpenChange}
        onSuccess={onRefetch}
      />

      <ModalDisponibilidade
        isOpen={disponibilidadeModal.isOpen}
        onOpenChange={disponibilidadeModal.onOpenChange}
        dataSelecionada={dataSelecionada}
      />
    </div>
  )
}
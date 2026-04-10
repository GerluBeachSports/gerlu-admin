import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Select, SelectItem, useDisclosure } from '@heroui/react'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  ArrowLeft01Icon,
  Delete02Icon,
  AlbumNotFound01Icon,
  FootballIcon,
  TennisBallIcon,
  VolleyballIcon,
  DashedLineCircleIcon,
  UserCircleIcon,
  Call02Icon,
  Time02Icon,
  Money03Icon,
  Calendar01Icon,
  Pen01Icon,
  BadmintonShuttleIcon,
  WorkoutStretchingIcon,
  Circle,
} from '@hugeicons/core-free-icons'
import {
  useRecurringBookings,
  useNovoRecurringBooking,
  useRemoverRecurringBooking,
  type RecurringBooking,
} from '../../hooks/configuracoes/useRecurringBookings'
import { useQuadras } from '../../hooks/agendamentos/useQuadras'
import { useEsportesPorQuadra } from '../../hooks/agendamentos/useEsportesPorQuadra'
import { ModalEditarRecurringBooking } from './modals/ModalEditarRecurringBooking'

// ── Constantes ────────────────────────────────────────────────────────────────
const DIAS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
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

function aplicarMascaraTelefone(valor: string): string {
  const nums = valor.replace(/\D/g, '').slice(0, 11)
  if (nums.length <= 2) return `(${nums}`
  if (nums.length <= 7) return `(${nums.slice(0, 2)}) ${nums.slice(2)}`
  return `(${nums.slice(0, 2)}) ${nums.slice(2, 7)}-${nums.slice(7)}`
}

function formatarPreco(n: number) {
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function formatarHorario(t: string) {
  return t.slice(0, 5)
}

// ── Estilos compartilhados ────────────────────────────────────────────────────
const inputBase =
  'w-full bg-lightblue rounded-xl px-4 py-3 text-sm focus:outline-none placeholder:text-gray-400'

const selectClass = {
  trigger: 'bg-lightblue rounded-xl px-3 h-10 shadow-none border-none data-[hover=true]:bg-lightblue/80',
  value: 'text-sm',
  popoverContent: 'rounded-xl shadow-lg border border-gray-100',
  listboxWrapper: 'max-h-48',
}

// ── Card de agendamento fixo ──────────────────────────────────────────────────
function CardFixo({
  booking,
  onEditar,
  onRemover,
}: {
  booking: RecurringBooking
  onEditar: () => void
  onRemover: () => void
}) {
  const esporteNome = booking.court_sport?.sport?.name ?? '—'
  const IconeEsporte = getIconeEsporte(esporteNome)
 
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-bold text-white bg-brand rounded-full px-3 py-1">
            {DIAS_COMPLETOS[booking.day_of_week]}
          </span>
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <HugeiconsIcon icon={Time02Icon} size={13} className="text-brand" />
            {formatarHorario(booking.start_time)} – {formatarHorario(booking.end_time)}
          </div>
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <HugeiconsIcon icon={IconeEsporte} size={13} className="text-brand" />
            {esporteNome}
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={onEditar}
            className="w-7 h-7 rounded-full bg-brand/10 hover:bg-brand/20 flex items-center justify-center transition-colors cursor-pointer"
          >
            <HugeiconsIcon icon={Pen01Icon} size={13} className="text-brand" />
          </button>
          <button
            onClick={onRemover}
            className="w-7 h-7 rounded-full bg-red-50 hover:bg-red-100 flex items-center justify-center transition-colors cursor-pointer"
          >
            <HugeiconsIcon icon={Delete02Icon} size={13} className="text-red-500" />
          </button>
        </div>
      </div>
 
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-1.5 text-xs text-gray-600">
          <HugeiconsIcon icon={UserCircleIcon} size={13} className="text-brand" />
          <span>{booking.user?.fullname ?? '—'}</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-gray-600">
          <HugeiconsIcon icon={Call02Icon} size={13} className="text-brand" />
          <span>{booking.user?.phone ?? '—'}</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-gray-600">
          <HugeiconsIcon icon={Money03Icon} size={13} className="text-brand" />
          <span className="font-semibold">{formatarPreco(booking.price)}</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-gray-500 ml-auto">
          <HugeiconsIcon icon={Calendar01Icon} size={13} className="text-gray-400" />
          <span>
            {new Date(booking.valid_from + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
            {booking.valid_until
              ? ` → ${new Date(booking.valid_until + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })}`
              : ' → indeterminado'}
          </span>
        </div>
      </div>
    </div>
  )
}

// ── Formulário ────────────────────────────────────────────────────────────────
const FORM_VAZIO = {
  fullname: '',
  telefone: '',
  quadraId: null as string | null,
  courtSportId: null as string | null,
  day_of_week: 1,
  start_time: '08:00:00',
  end_time: '09:00:00',
  price: '',
  valid_from: new Date().toISOString().slice(0, 10),
  valid_until: '',
}

function FormNovoFixo({ onSuccess }: { onSuccess: () => void }) {
  const [form, setForm] = useState(FORM_VAZIO)
  const [erro, setErro] = useState<string | null>(null)

  const { quadras } = useQuadras()
  const { esportes } = useEsportesPorQuadra(form.quadraId)
  const { criarRecurringBooking, loading } = useNovoRecurringBooking()

  const phoneNumeros = form.telefone.replace(/\D/g, '')
  const telefoneValido = phoneNumeros.length === 11 && phoneNumeros[2] === '9'

  function reset() {
    setForm(FORM_VAZIO)
    setErro(null)
  }

  async function handleSalvar() {
    setErro(null)

    if (!form.fullname.trim()) return setErro('Informe o nome do cliente.')
    if (!telefoneValido) return setErro('Telefone inválido.')
    if (!form.courtSportId) return setErro('Selecione a quadra e o esporte.')
    if (form.start_time >= form.end_time) return setErro('Horário de início deve ser anterior ao fim.')

    const priceNum = parseFloat(String(form.price).replace(',', '.'))
    if (isNaN(priceNum) || priceNum <= 0) return setErro('Informe um valor válido.')

    const ok = await criarRecurringBooking({
      fullname: form.fullname.trim(),
      phone: phoneNumeros,
      court_sport_id: form.courtSportId,
      day_of_week: form.day_of_week,
      start_time: form.start_time,
      end_time: form.end_time,
      price: priceNum,
      valid_from: form.valid_from,
      valid_until: form.valid_until ? form.valid_until : null,
    })

    if (!ok) return setErro('Erro ao salvar. Tente novamente.')

    reset()
    onSuccess()
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col gap-4">
      <p className="text-sm font-semibold text-gray-700">Novo agendamento fixo</p>

      {/* Cliente */}
      <div className="grid grid-cols-2 gap-3">
        <input
          className={inputBase}
          placeholder="Nome completo"
          value={form.fullname}
          onChange={e => setForm(p => ({ ...p, fullname: e.target.value }))}
        />
        <input
          className={inputBase}
          placeholder="(XX) 9XXXX-XXXX"
          value={form.telefone}
          onChange={e => setForm(p => ({ ...p, telefone: aplicarMascaraTelefone(e.target.value) }))}
        />
      </div>

      {/* Quadra + Esporte */}
      <div className="grid grid-cols-2 gap-3">
        <Select
          aria-label="Quadra"
          placeholder="Selecionar Quadra"
          selectedKeys={form.quadraId ? new Set([form.quadraId]) : new Set()}
          onSelectionChange={(keys) => {
            const val = Array.from(keys)[0] as string ?? null
            setForm(p => ({ ...p, quadraId: val, courtSportId: null }))
          }}
          classNames={selectClass}
        >
          {quadras.map(q => (
            <SelectItem key={q.id}>{q.name}</SelectItem>
          ))}
        </Select>

        <Select
          aria-label="Esporte"
          placeholder="Selecionar Esporte"
          isDisabled={!form.quadraId}
          selectedKeys={form.courtSportId ? new Set([form.courtSportId]) : new Set()}
          onSelectionChange={(keys) => {
            const val = Array.from(keys)[0] as string ?? null
            setForm(p => ({ ...p, courtSportId: val }))
          }}
          classNames={selectClass}
        >
          {esportes.map(e => (
            <SelectItem key={e.court_sport_id}>{e.sport_name}</SelectItem>
          ))}
        </Select>
      </div>

      {/* Dia + Horários */}
      <div className="grid grid-cols-3 gap-3">
        <Select
          aria-label="Dia da semana"
          selectedKeys={new Set([String(form.day_of_week)])}
          onSelectionChange={(keys) =>
            setForm(p => ({ ...p, day_of_week: Number(Array.from(keys)[0]) }))
          }
          classNames={selectClass}
        >
          {DIAS.map((d, i) => (
            <SelectItem key={String(i)}>{d}</SelectItem>
          ))}
        </Select>

        <Select
          aria-label="Início"
          selectedKeys={new Set([form.start_time])}
          onSelectionChange={(keys) =>
            setForm(p => ({ ...p, start_time: Array.from(keys)[0] as string }))
          }
          classNames={selectClass}
        >
          {HORARIOS.map(h => (
            <SelectItem key={h.value}>{h.label}</SelectItem>
          ))}
        </Select>

        <Select
          aria-label="Fim"
          selectedKeys={new Set([form.end_time])}
          onSelectionChange={(keys) =>
            setForm(p => ({ ...p, end_time: Array.from(keys)[0] as string }))
          }
          classNames={selectClass}
        >
          {HORARIOS.map(h => (
            <SelectItem key={h.value}>{h.label}</SelectItem>
          ))}
        </Select>
      </div>

      {/* Preço + Validade */}
      <div className="grid grid-cols-3 gap-3">
        <div className="flex items-center bg-lightblue rounded-xl px-4 h-10 gap-2">
          <span className="text-sm text-gray-400 shrink-0">R$</span>
          <input
            className="flex-1 bg-transparent text-sm focus:outline-none placeholder:text-gray-400"
            placeholder="Valor"
            value={form.price}
            onChange={e => setForm(p => ({ ...p, price: e.target.value }))}
          />
        </div>

        <div className="flex flex-col gap-y-0.5">
          <p className="text-[10px] text-gray-400 px-1">Início vigência</p>
          <input
            type="date"
            className={`${inputBase} py-2`}
            value={form.valid_from}
            onChange={e => setForm(p => ({ ...p, valid_from: e.target.value }))}
          />
        </div>

        <div className="flex flex-col gap-y-0.5">
          <p className="text-[10px] text-gray-400 px-1">Fim vigência (opcional)</p>
          <input
            type="date"
            className={`${inputBase} py-2`}
            value={form.valid_until}
            onChange={e => setForm(p => ({ ...p, valid_until: e.target.value }))}
          />
        </div>
      </div>

      {erro && <p className="text-red-500 text-xs text-center">{erro}</p>}

      <button
        className="confirm-button disabled:opacity-50 disabled:cursor-not-allowed"
        disabled={loading}
        onClick={handleSalvar}
      >
        {loading ? 'Salvando...' : '+ Adicionar fixo'}
      </button>
    </div>
  )
}

// ── Página principal ──────────────────────────────────────────────────────────
export function AgendamentosFixosPage() {
  const navigate = useNavigate()
  const { bookings, loading, error, refetch } = useRecurringBookings()
  const { remover } = useRemoverRecurringBooking()

  const editarModal = useDisclosure()
  const [bookingEditando, setBookingEditando] = useState<RecurringBooking | null>(null)

  async function handleRemover(id: string) {
    const ok = await remover(id)
    if (ok) refetch()
  }

  function handleAbrirEditar(booking: RecurringBooking) {
    setBookingEditando(booking)
    editarModal.onOpen()
  }

  // Agrupa por quadra
  const porQuadra = bookings.reduce<Record<string, { nome: string; imageUrl: string | null; items: RecurringBooking[] }>>(
    (acc, b) => {
      const court = b.court_sport?.court
      if (!court) return acc
      if (!acc[court.id]) acc[court.id] = { nome: court.name, imageUrl: court.image_url, items: [] }
      acc[court.id].items.push(b)
      return acc
    },
    {}
  )

  return (
    <main className="max-w-4xl mx-auto px-6 py-8 flex flex-col gap-8">

      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/configuracoes')}
          className="w-9 h-9 rounded-full bg-lightblue flex items-center justify-center hover:bg-lightblue/70 transition-colors cursor-pointer"
        >
          <HugeiconsIcon icon={ArrowLeft01Icon} size={18} className="text-brand" />
        </button>
        <div>
          <h1 className="font-montserrat font-bold text-xl text-gray-900">Agendamentos Fixos</h1>
          <p className="text-xs text-gray-400 mt-0.5">Horários recorrentes por quadra</p>
        </div>
      </div>

      {/* Formulário */}
      <FormNovoFixo onSuccess={refetch} />

      {/* Lista */}
      {loading ? (
        <p className="text-sm text-gray-400 animate-pulse text-center">Carregando...</p>
      ) : error ? (
        <p className="text-sm text-red-400 text-center">{error}</p>
      ) : bookings.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-12 text-gray-400">
          <HugeiconsIcon icon={AlbumNotFound01Icon} size={36} />
          <p className="text-sm">Nenhum agendamento fixo cadastrado.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          {Object.entries(porQuadra).map(([courtId, grupo]) => (
            <div key={courtId} className="flex flex-col gap-3">
              {/* Cabeçalho do grupo */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl overflow-hidden bg-gray-100 shrink-0 flex items-center justify-center">
                  {grupo.imageUrl ? (
                    <img src={grupo.imageUrl} alt={grupo.nome} className="w-full h-full object-cover" />
                  ) : (
                    <HugeiconsIcon icon={AlbumNotFound01Icon} size={18} className="text-gray-300" />
                  )}
                </div>
                <p className="font-montserrat font-semibold text-gray-800">{grupo.nome}</p>
                <span className="text-xs text-gray-400 font-normal">
                  {grupo.items.length} fixo{grupo.items.length !== 1 ? 's' : ''}
                </span>
              </div>

              {/* Cards */}
              <div className="flex flex-col gap-2 pl-1">
                {grupo.items.map(b => (
                  <CardFixo
                    key={b.id}
                    booking={b}
                    onEditar={() => handleAbrirEditar(b)}
                    onRemover={() => handleRemover(b.id)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <ModalEditarRecurringBooking
        isOpen={editarModal.isOpen}
        onOpenChange={editarModal.onOpenChange}
        booking={bookingEditando}
        onSuccess={refetch}
      />
    </main>
  )
}
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDisclosure } from '@heroui/react'
import { HugeiconsIcon } from '@hugeicons/react'
import { Pen01Icon, Delete02Icon, CircleArrowLeft01Icon, CircleArrowRight01Icon } from '@hugeicons/core-free-icons'
import { useGerenciarHorarios, type GradePadrao, type Excecao, type QuadraHorarios } from '../../hooks/configuracoes/useGerenciarHorarios'
import { ModalEditarGrade } from './modals/ModalEditarGrade'
import { ModalExcecao } from './modals/ModalExcecao'
import { ModalConfirmarExclusaoExcecao } from './modals/ModalConfirmarExclusaoExcecao'

const DIAS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const DIAS_COMPLETO = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado']

function formatarHorario(time: string | null): string {
  if (!time) return '—'
  return time.slice(0, 5)
}

function formatarData(dateStr: string): string {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  })
}

function TagExcecao({ excecao }: { excecao: Excecao }) {
  if (!excecao.open_time) {
    return (
      <span className="bg-red-100 text-red-600 text-xs font-medium px-2 py-0.5 rounded-full">
        Fechado
      </span>
    )
  }

  const intervalo1 = `${formatarHorario(excecao.open_time)}–${formatarHorario(excecao.close_time)}`
  const intervalo2 = excecao.open_time_2
    ? ` · ${formatarHorario(excecao.open_time_2)}–${formatarHorario(excecao.close_time_2)}`
    : ''

  return (
    <span className="bg-brand/10 text-brand text-xs font-medium px-2 py-0.5 rounded-full">
      {intervalo1}{intervalo2}
    </span>
  )
}

function SecaoQuadra({
  quadra,
  onEditarGrade,
  onNovaGrade,
  onNovaExcecao,
  onEditarExcecao,
  onExcluirExcecao,
  pagina,
  totalPaginas,
  onMudarPagina,
  itensPaginados,
}: {
  quadra: QuadraHorarios
  onEditarGrade: (grade: GradePadrao) => void
  onNovaGrade: (courtId: string, dayOfWeek: number) => void
  onNovaExcecao: (courtId: string) => void
  onEditarExcecao: (excecao: Excecao) => void
  onExcluirExcecao: (excecao: Excecao) => void
  pagina: number
  totalPaginas: number
  onMudarPagina: (p: number) => void
  itensPaginados: Excecao[]
}) {
  return (
    <div className="border rounded-2xl overflow-hidden shadow-sm">
      {/* Header da quadra */}
      <div className="gradient-background px-6 py-4">
        <h3 className="text-white font-montserrat font-bold text-base">{quadra.name}</h3>
      </div>

      <div className="p-6 flex flex-col gap-y-6">

        {/* Grade padrão */}
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
            Grade Padrão
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
              {DIAS.map((_diaAbrev, idx) => {
                const item = quadra.grade.find(g => g.day_of_week === idx)
                return (
                  <div
                    key={idx}
                    className="flex items-center justify-between bg-lightblue rounded-xl px-3 py-2.5"
                  >
                    <div>
                      <p className="text-xs font-semibold text-gray-500">{DIAS_COMPLETO[idx]}</p>
                      <p className="text-sm font-medium mt-0.5">
                        {item
                          ? `${formatarHorario(item.open_time)} – ${formatarHorario(item.close_time)}`
                          : <span className="text-gray-400 text-xs">Sem grade</span>
                        }
                      </p>
                    </div>
                    {item ? (
                      <button
                        onClick={() => onEditarGrade(item)}
                        className="w-7 h-7 rounded-full bg-brand flex items-center justify-center cursor-pointer hover:bg-brand/80 transition-colors shrink-0 ml-2"
                      >
                        <HugeiconsIcon icon={Pen01Icon} size={12} className="text-white" />
                      </button>
                    ) : (
                      <button
                        onClick={() => onNovaGrade(quadra.id, idx)}
                        className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center cursor-pointer hover:bg-brand hover:text-white transition-colors shrink-0 ml-2 text-gray-400 font-bold text-base leading-none"
                      >
                        +
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
        </div>

        {/* Exceções */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
              Exceções {quadra.totalExcecoes > 0 && `(${quadra.totalExcecoes})`}
            </p>
            <button
              onClick={() => onNovaExcecao(quadra.id)}
              className="text-xs text-brand font-semibold cursor-pointer hover:underline"
            >
              + Nova exceção
            </button>
          </div>

          {itensPaginados.length === 0 ? (
            <p className="text-sm text-gray-400">Nenhuma exceção cadastrada.</p>
          ) : (
            <div className="flex flex-col gap-y-2">
              {itensPaginados.map(exc => (
                <div
                  key={exc.id}
                  className="flex items-center justify-between border rounded-xl px-4 py-3"
                >
                  <div className="flex items-center gap-x-3">
                    <p className="text-sm font-medium w-24 shrink-0">{formatarData(exc.date)}</p>
                    <TagExcecao excecao={exc} />
                    {exc.reason && (
                      <p className="text-xs text-gray-400 hidden sm:block">{exc.reason}</p>
                    )}
                  </div>

                  <div className="flex gap-1.5 shrink-0 ml-2">
                    <button
                      onClick={() => onEditarExcecao(exc)}
                      className="w-7 h-7 rounded-full bg-brand flex items-center justify-center cursor-pointer hover:bg-brand/80 transition-colors"
                    >
                      <HugeiconsIcon icon={Pen01Icon} size={12} className="text-white" />
                    </button>
                    <button
                      onClick={() => onExcluirExcecao(exc)}
                      className="w-7 h-7 rounded-full bg-red-500 flex items-center justify-center cursor-pointer hover:bg-red-600 transition-colors"
                    >
                      <HugeiconsIcon icon={Delete02Icon} size={12} className="text-white" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Paginação */}
          {totalPaginas > 1 && (
            <div className="flex items-center justify-center gap-3 mt-4">
              <button
                onClick={() => onMudarPagina(pagina - 1)}
                disabled={pagina === 1}
                className="cursor-pointer disabled:opacity-30"
              >
                <HugeiconsIcon icon={CircleArrowLeft01Icon} size={20} />
              </button>
              <span className="text-sm text-gray-500">
                {pagina} / {totalPaginas}
              </span>
              <button
                onClick={() => onMudarPagina(pagina + 1)}
                disabled={pagina === totalPaginas}
                className="cursor-pointer disabled:opacity-30"
              >
                <HugeiconsIcon icon={CircleArrowRight01Icon} size={20} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export function GerenciarHorariosPage() {
  const navigate = useNavigate()
  const {
    quadras, loading,
    salvarGrade, salvarExcecao, excluirExcecao,
    setPagina, getExcecoesPaginadas,
  } = useGerenciarHorarios()

  // Modal grade
  const gradeModal = useDisclosure()
  const [gradeSelecionada, setGradeSelecionada] = useState<GradePadrao | null>(null)

  // Modal exceção
  const excecaoModal = useDisclosure()
  const [courtIdExcecao, setCourtIdExcecao] = useState<string>('')
  const [excecaoSelecionada, setExcecaoSelecionada] = useState<Excecao | null>(null)

  // Modal exclusão
  const exclusaoModal = useDisclosure()
  const [excecaoExcluindo, setExcecaoExcluindo] = useState<Excecao | null>(null)

  function handleEditarGrade(grade: GradePadrao) {
    setGradeSelecionada(grade)
    gradeModal.onOpen()
  }

  function handleNovaGrade(courtId: string, dayOfWeek: number) {
    setGradeSelecionada({ id: '', court_id: courtId, day_of_week: dayOfWeek, open_time: '08:00:00', close_time: '22:00:00' })
    gradeModal.onOpen()
  }

  function handleNovaExcecao(courtId: string) {
    setCourtIdExcecao(courtId)
    setExcecaoSelecionada(null)
    excecaoModal.onOpen()
  }

  function handleEditarExcecao(courtId: string, excecao: Excecao) {
    setCourtIdExcecao(courtId)
    setExcecaoSelecionada(excecao)
    excecaoModal.onOpen()
  }

  function handleExcluirExcecao(excecao: Excecao) {
    setExcecaoExcluindo(excecao)
    exclusaoModal.onOpen()
  }

  return (
    <main className="px-6 md:px-12 pb-12 mt-10">

      {/* Cabeçalho */}
      <div className="flex items-center gap-x-4 mb-8">
        <button
          onClick={() => navigate('/configuracoes')}
          className="cursor-pointer text-gray-400 hover:text-brand transition-colors"
        >
          <HugeiconsIcon icon={CircleArrowLeft01Icon} size={24} />
        </button>
        <h1 className="font-montserrat font-bold text-2xl">Central de Horários</h1>
      </div>

      {loading ? (
        <p className="text-sm text-gray-400 animate-pulse">Carregando...</p>
      ) : quadras.length === 0 ? (
        <p className="text-sm text-gray-400">Nenhuma quadra cadastrada.</p>
      ) : (
        <div className="flex flex-col gap-y-6">
          {quadras.map(quadra => {
            const { itens, totalPaginas, pagina } = getExcecoesPaginadas(quadra)
            return (
              <SecaoQuadra
                key={quadra.id}
                quadra={quadra}
                onEditarGrade={handleEditarGrade}
                onNovaGrade={handleNovaGrade}
                onNovaExcecao={handleNovaExcecao}
                onEditarExcecao={(exc) => handleEditarExcecao(quadra.id, exc)}
                onExcluirExcecao={handleExcluirExcecao}
                pagina={pagina}
                totalPaginas={totalPaginas}
                onMudarPagina={(p) => setPagina(quadra.id, p)}
                itensPaginados={itens}
              />
            )
          })}
        </div>
      )}

      <ModalEditarGrade
        isOpen={gradeModal.isOpen}
        onOpenChange={gradeModal.onOpenChange}
        grade={gradeSelecionada}
        onSalvar={salvarGrade}
      />

      <ModalExcecao
        isOpen={excecaoModal.isOpen}
        onOpenChange={excecaoModal.onOpenChange}
        courtId={courtIdExcecao}
        excecao={excecaoSelecionada}
        onSalvar={salvarExcecao}
      />

      <ModalConfirmarExclusaoExcecao
        isOpen={exclusaoModal.isOpen}
        onOpenChange={exclusaoModal.onOpenChange}
        dataExcecao={excecaoExcluindo ? formatarData(excecaoExcluindo.date) : ''}
        onConfirmar={() => excluirExcecao(excecaoExcluindo!.id)}
      />
    </main>
  )
}
import { useDisclosure } from "@heroui/react"
import { HugeiconsIcon } from "@hugeicons/react"
import { UserCircleIcon, Money03Icon, InformationCircleIcon } from '@hugeicons/core-free-icons'
import { ModalInfoAluno } from "../modals/ModalInfoAluno"
import { ModalPagamentosAluno } from "../modals/ModalPagamentosAluno"
import { type Aluno, type Status } from "../../../hooks/academia/useAlunos"
import { useState } from "react"

const statusConfig: Record<Status, { label: string; className: string }> = {
  ativo:    { label: "Ativo",    className: "border-[var(--color-activeuser)]  text-[var(--color-activeuser)]"  },
  inativo:  { label: "Inativo",  className: "border-[var(--color-inativeuser)] text-[var(--color-inativeuser)]" },
  expirado: { label: "Expirado", className: "border-[var(--color-expireduser)] text-[var(--color-expireduser)]" },
}

interface Props {
  alunos: Aluno[]
  loading: boolean
  onRefetch: () => void
}

export function TabelaAlunos({ alunos, loading, onRefetch }: Props) {
  const { isOpen: isOpenInfo, onOpen: onOpenInfo, onOpenChange: onOpenChangeInfo } = useDisclosure()
  const { isOpen: isOpenPagamento, onOpen: onOpenPagamento, onOpenChange: onOpenChangePagamento } = useDisclosure()
  const [alunoSelecionado, setAlunoSelecionado] = useState<Aluno | null>(null)

  function abrirInfo(aluno: Aluno) {
    setAlunoSelecionado(aluno)
    onOpenInfo()
  }

  function abrirPagamento(aluno: Aluno) {
    setAlunoSelecionado(aluno)
    onOpenPagamento()
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-10 h-10 rounded-full border-3 border-gray-200 border-t-brand animate-spin" />
      </div>
    )
  }

  if (alunos.length === 0) {
    return <p className="text-center text-gray-400 py-12 text-sm">Nenhum aluno encontrado.</p>
  }

  const LinhaTabela = ({ aluno }: { aluno: Aluno }) => {
    const { label, className } = statusConfig[aluno.status]
    return (
      <tr className="border-b border-gray-200">
        <td className="px-4 py-3 whitespace-nowrap">
          <div className="flex items-center gap-2">
            <HugeiconsIcon icon={UserCircleIcon} size={20} />
            {aluno.nome}
          </div>
        </td>
        <td className="px-4 py-3 whitespace-nowrap">{aluno.telefone}</td>
        <td className="px-4 py-3 whitespace-nowrap text-center">{aluno.ultimoPagamento ?? '—'}</td>
        <td className="px-4 py-3 whitespace-nowrap text-center">{aluno.dataVencimento ?? '—'}</td>
        <td className="px-4 py-3 whitespace-nowrap text-center">
          {aluno.mensalidade != null ? `R$ ${aluno.mensalidade.toFixed(2).replace('.', ',')}` : '—'}
        </td>
        <td className="px-4 py-3 whitespace-nowrap text-center">
          <span className={`inline-block px-3 py-0.5 rounded-full text-xs font-medium border ${className}`}>
            {label}
          </span>
        </td>
        <td className="px-4 py-3 text-center">
          <button className="text-gray-400 hover:text-gray-700 transition-colors cursor-pointer" onClick={() => abrirInfo(aluno)}>
            <HugeiconsIcon icon={InformationCircleIcon} size={18} />
          </button>
        </td>
        <td className="px-4 py-3 text-center">
          <button className="text-gray-400 hover:text-gray-700 transition-colors cursor-pointer" onClick={() => abrirPagamento(aluno)}>
            <HugeiconsIcon icon={Money03Icon} size={18} />
          </button>
        </td>
      </tr>
    )
  }

  return (
    <>
      {/* Desktop */}
      <div className="hidden md:block w-full overflow-x-auto rounded-2xl border">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-brand text-white">
              <th className="px-4 py-3 text-center font-medium whitespace-nowrap">Nome Completo</th>
              <th className="px-4 py-3 text-center font-medium whitespace-nowrap">Telefone</th>
              <th className="px-4 py-3 text-center font-medium whitespace-nowrap">Último Pagamento</th>
              <th className="px-4 py-3 text-center font-medium whitespace-nowrap">Data de Vencimento</th>
              <th className="px-4 py-3 text-center font-medium whitespace-nowrap">Mensalidade</th>
              <th className="px-4 py-3 text-center font-medium whitespace-nowrap">Status</th>
              <th className="px-4 py-3 text-center font-medium whitespace-nowrap">Informações</th>
              <th className="px-4 py-3 text-center font-medium whitespace-nowrap">Pagamentos</th>
            </tr>
          </thead>
          <tbody>
            {alunos.map(aluno => <LinhaTabela key={aluno.id} aluno={aluno} />)}
          </tbody>
        </table>
      </div>

      {/* Mobile */}
      <div className="flex flex-col gap-3 md:hidden">
        {alunos.map((aluno) => {
          const { label, className } = statusConfig[aluno.status]
          return (
            <div key={aluno.id} className="rounded-2xl border p-4 flex flex-col gap-2 text-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-medium">
                  <HugeiconsIcon icon={UserCircleIcon} size={20} />
                  {aluno.nome}
                </div>
                <span className={`inline-block px-3 py-0.5 rounded-full text-xs font-medium border ${className}`}>
                  {label}
                </span>
              </div>
              <div className="text-gray-500">{aluno.telefone}</div>
              <div className="text-xs text-gray-500">Último pagamento: <span className="text-gray-800">{aluno.ultimoPagamento ?? '—'}</span></div>
              <div className="text-xs text-gray-500">Vencimento: <span className="text-gray-800">{aluno.dataVencimento ?? '—'}</span></div>
              <div className="text-xs font-semibold text-gray-800">
                {aluno.mensalidade != null ? `R$ ${aluno.mensalidade.toFixed(2).replace('.', ',')}` : '—'}
              </div>
              <div className="flex justify-end gap-3 pt-1">
                <button className="text-gray-400 hover:text-gray-700 transition-colors" onClick={() => abrirInfo(aluno)}>
                  <HugeiconsIcon icon={InformationCircleIcon} size={18} />
                </button>
                <button className="text-gray-400 hover:text-gray-700 transition-colors" onClick={() => abrirPagamento(aluno)}>
                  <HugeiconsIcon icon={Money03Icon} size={18} />
                </button>
              </div>
            </div>
          )
        })}
      </div>

      <ModalInfoAluno
        isOpen={isOpenInfo}
        onOpenChange={onOpenChangeInfo}
        aluno={alunoSelecionado}
        onSuccess={onRefetch}
      />

      <ModalPagamentosAluno
        isOpen={isOpenPagamento}
        onOpenChange={onOpenChangePagamento}
        aluno={alunoSelecionado}
        onSuccess={onRefetch}
      />

    </>
  )
}
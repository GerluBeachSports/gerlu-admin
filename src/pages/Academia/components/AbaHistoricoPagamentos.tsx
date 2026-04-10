import { useState } from "react"
import { useDisclosure } from "@heroui/react"
import { HugeiconsIcon } from "@hugeicons/react"
import { UserCircleIcon, PencilEdit01Icon } from '@hugeicons/core-free-icons'
import { type Aluno } from "../../../hooks/academia/useAlunos"
import { type Pagamento } from "../../../hooks/academia/usePagamentosAluno"
import { ModalEditarPagamento } from "../modals/ModalEditarPagamento"

interface Props {
    aluno: Aluno | null
    pagamentos: Pagamento[]
    loading: boolean
    pagina: number
    totalPaginas: number
    irParaPagina: (p: number) => void
    editarPagamento: (id: string, dados: { amount: number; paid_at: string; due_date: string; payment_receipt_url?: string | null }) => Promise<boolean>
}

export function AbaHistoricoPagamentos({ aluno, pagamentos, loading, pagina, totalPaginas, irParaPagina, editarPagamento }: Props) {
    const [pagamentoSelecionado, setPagamentoSelecionado] = useState<Pagamento | null>(null)
    const { isOpen, onOpen, onOpenChange } = useDisclosure()

    function abrirEditar(pagamento: Pagamento) {
        setPagamentoSelecionado(pagamento)
        onOpen()
    }

    if (loading) return (
        <div className="flex justify-center py-8">
            <div className="w-8 h-8 rounded-full border-3 border-gray-200 border-t-brand animate-spin" />
        </div>
    )

    if (pagamentos.length === 0) return (
        <p className="text-center text-gray-400 py-8 text-sm">Nenhum pagamento encontrado.</p>
    )

    const BotaoComprovante = ({ pagamento }: { pagamento: Pagamento }) => {

        if (pagamento.payment_receipt_url) return (
            <button
                onClick={() => {
                    const url = pagamento.payment_receipt_url!
                    const isPdf = url.toLowerCase().includes('.pdf')
                    if (isPdf) {
                        window.open(`/comprovante?url=${encodeURIComponent(url)}`, '_blank')
                    } else {
                        window.open(url, '_blank')
                    }
                }}
                className="px-3 py-1 text-xs rounded-md border border-brand text-brand hover:bg-brand/10 transition-colors cursor-pointer"
            >
                Ver Comprovante
            </button>
        )

        return <span className="text-xs text-gray-400">Nenhum comprovante</span>
    }

    return (
        <>
            <div className="flex flex-col gap-4">
                {/* Desktop */}
                <div className="hidden md:block w-full overflow-x-auto rounded-2xl border">
                    <table className="w-full border-collapse text-sm">
                        <thead>
                            <tr className="bg-brand text-white">
                                <th className="px-4 py-3 text-center font-medium whitespace-nowrap">Nome Completo</th>
                                <th className="px-4 py-3 text-center font-medium whitespace-nowrap">Data do Pagamento</th>
                                <th className="px-4 py-3 text-center font-medium whitespace-nowrap">Comprovante</th>
                                <th className="px-4 py-3 text-center font-medium whitespace-nowrap">Valor</th>
                                <th className="px-4 py-3 text-center font-medium whitespace-nowrap">Editar</th>
                            </tr>
                        </thead>
                        <tbody>
                            {pagamentos.map((p) => (
                                <tr key={p.id} className="border-b border-gray-200">
                                    <td className="px-4 py-3 whitespace-nowrap">
                                        <div className="flex items-center gap-2">
                                            <HugeiconsIcon icon={UserCircleIcon} size={20} />
                                            {aluno?.nome}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-center">{p.paid_at_formatado}</td>
                                    <td className="px-4 py-3 whitespace-nowrap text-center">
                                        <BotaoComprovante pagamento={p} />
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-center">
                                        R$ {p.amount.toFixed(2).replace('.', ',')}
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <button
                                            onClick={() => abrirEditar(p)}
                                            className="text-gray-400 hover:text-brand transition-colors cursor-pointer"
                                        >
                                            <HugeiconsIcon icon={PencilEdit01Icon} size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Mobile */}
                <div className="flex flex-col gap-3 md:hidden">
                    {pagamentos.map((p) => (
                        <div key={p.id} className="rounded-2xl border p-4 flex flex-col gap-2 text-sm">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 font-medium">
                                    <HugeiconsIcon icon={UserCircleIcon} size={20} />
                                    {aluno?.nome}
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="font-semibold">R$ {p.amount.toFixed(2).replace('.', ',')}</span>
                                    <button onClick={() => abrirEditar(p)} className="text-gray-400 hover:text-brand transition-colors cursor-pointer">
                                        <HugeiconsIcon icon={PencilEdit01Icon} size={18} />
                                    </button>
                                </div>
                            </div>
                            <div className="text-xs text-gray-500">
                                Pagamento: <span className="text-gray-800">{p.paid_at_formatado}</span>
                            </div>
                            <div className="flex justify-end pt-1">
                                <BotaoComprovante pagamento={p} />
                            </div>
                        </div>
                    ))}
                </div>

                {/* Paginação */}
                {totalPaginas > 1 && (
                    <div className="flex items-center justify-center gap-2 mt-2">
                        <button
                            onClick={() => irParaPagina(pagina - 1)}
                            disabled={pagina === 1}
                            className="px-3 py-1 text-sm rounded-lg border border-brand text-brand disabled:opacity-30 disabled:cursor-not-allowed hover:bg-brand/10 cursor-pointer"
                        >
                            Anterior
                        </button>
                        {Array.from({ length: totalPaginas }, (_, i) => i + 1).map(p => (
                            <button
                                key={p}
                                onClick={() => irParaPagina(p)}
                                className={`w-8 h-8 text-sm rounded-lg border transition-colors cursor-pointer
                                    ${p === pagina
                                        ? 'bg-brand text-white border-brand'
                                        : 'border-brand text-brand hover:bg-brand/10'
                                    }`}
                            >
                                {p}
                            </button>
                        ))}
                        <button
                            onClick={() => irParaPagina(pagina + 1)}
                            disabled={pagina === totalPaginas}
                            className="px-3 py-1 text-sm rounded-lg border border-brand text-brand disabled:opacity-30 disabled:cursor-not-allowed hover:bg-brand/10 cursor-pointer"
                        >
                            Próxima
                        </button>
                    </div>
                )}
            </div>

            <ModalEditarPagamento
                isOpen={isOpen}
                onOpenChange={onOpenChange}
                pagamento={pagamentoSelecionado}
                onSalvar={editarPagamento}
            />
        </>
    )
}
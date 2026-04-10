import {
    Modal, ModalContent, ModalHeader, ModalBody, Tabs, Tab,
} from "@heroui/react"
import { useRef } from "react"
import { AbaNovoPagamento } from "../components/AbaNovoPagamento"
import { AbaHistoricoPagamentos } from "../components/AbaHistoricoPagamentos"
import { usePagamentosAluno } from "../../../hooks/academia/usePagamentosAluno"
import { type Aluno } from "../../../hooks/academia/useAlunos"

interface Props {
    isOpen: boolean
    onOpenChange: (open: boolean) => void
    aluno: Aluno | null
    onSuccess?: () => void
}

export function ModalPagamentosAluno({ isOpen, onOpenChange, aluno, onSuccess }: Props) {
    const houveAlteracao = useRef(false)
    const { pagamentos, loading, pagina, totalPaginas, irParaPagina, editarPagamento } = usePagamentosAluno(aluno?.id ?? null)

    return (
        <Modal
            isOpen={isOpen}
            onOpenChange={(open) => {
                if (!open) {
                    if (houveAlteracao.current) {
                        onSuccess?.()
                        houveAlteracao.current = false
                    }
                }
                onOpenChange(open)
            }}
            placement="center"
            size="5xl"
            scrollBehavior="inside"
            classNames={{
                wrapper: "px-4",
                closeButton: "text-white hover:bg-white/40 cursor-pointer p-1"
            }}
            className="rounded-t-xl"
        >
            <ModalContent>
                <>
                    <ModalHeader className="flex justify-center gradient-background text-white rounded-t-xl">
                        Pagamentos — {aluno?.nome ?? ''}
                    </ModalHeader>

                    <ModalBody className="my-4">
                        <Tabs
                            aria-label="Pagamentos"
                            classNames={{
                                tabList: "mx-auto",
                                cursor: "bg-brand",
                                tab: "data-[selected=true]:text-white",
                                tabContent: "group-data-[selected=true]:text-white"
                            }}
                        >
                            <Tab key="novo" title="Novo pagamento">
                                <AbaNovoPagamento
                                    aluno={aluno}
                                    onSuccess={() => {
                                        onSuccess?.()
                                        onOpenChange(false)
                                    }} />
                            </Tab>
                            <Tab key="historico" title="Histórico de pagamentos">
                                <AbaHistoricoPagamentos
                                    aluno={aluno}
                                    pagamentos={pagamentos}
                                    loading={loading}
                                    pagina={pagina}
                                    totalPaginas={totalPaginas}
                                    irParaPagina={irParaPagina}
                                    editarPagamento={async (id, dados) => {
                                        const ok = await editarPagamento(id, dados)
                                        if (ok) houveAlteracao.current = true
                                        return ok
                                    }}
                                />
                            </Tab>
                        </Tabs>
                    </ModalBody>
                </>
            </ModalContent>
        </Modal>
    )
}
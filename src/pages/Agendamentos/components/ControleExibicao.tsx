import { HugeiconsIcon } from "@hugeicons/react"
import { Appointment02Icon, MoneyAdd02Icon } from "@hugeicons/core-free-icons"
import { Calendar, useDisclosure } from "@heroui/react"
import { CalendarDate } from "@internationalized/date";
import { ModalNovoAgendamento } from "../modals/ModalNovoAgendamento";

interface Props {
    dataSelecionada: CalendarDate
    setDataSelecionada: (data: CalendarDate) => void
    visualizacao: "dia" | "mes"
    setVisualizacao: (v: "dia" | "mes") => void
    onNovoAgendamento: () => void
    quantidade: number
    faturamento: number
}


export function ControleExibicao({ dataSelecionada, setDataSelecionada, visualizacao, setVisualizacao, onNovoAgendamento, quantidade, faturamento }: Props) {
    const { isOpen, onOpen, onOpenChange } = useDisclosure()

    const faturamentoFormatado = faturamento.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    })

    return (
        <div className="flex flex-col">
            <div className="max-w-fit border p-5 rounded-2xl shadow-lg">
                <div className="flex justify-center">
                    <Calendar
                        aria-label="Date (Uncontrolled)"
                        value={dataSelecionada}
                        onChange={setDataSelecionada}
                        focusedValue={dataSelecionada}
                        onFocusChange={setDataSelecionada}
                        classNames={{
                            cellButton: `data-[selected=true]:bg-brand data-[selected=true]:text-white`
                        }}
                    />
                </div>

                <div className="mt-6 space-y-3">
                    <div className="flex items-center gap-x-2">
                        <HugeiconsIcon icon={Appointment02Icon} size={20} />
                        <span className="text-xs font-medium">{quantidade} Horário(s) Marcado(s)</span>
                    </div>

                    <div className="flex items-center gap-x-2">
                        <HugeiconsIcon icon={MoneyAdd02Icon} size={20} />
                        <span className="text-xs font-medium">Faturamento Previsto: {faturamentoFormatado}</span>
                    </div>
                </div>
            </div>


            <div className="mt-4 flex flex-col justify-center">
                <button className="button-g" onClick={onOpen}>
                    Adicionar Agendamento
                </button>

                <div className="mt-4">
                    <p className="text-center">Configurações de Visualização</p>

                    <div className="flex justify-center gap-x-4 mt-2">
                        <button
                            onClick={() => setVisualizacao("dia")}
                            className={`flex-1 rounded-2xl py-2 cursor-pointer transition-all
                            ${visualizacao === "dia"
                                    ? "bg-brand text-white"
                                    : "border border-brand text-brand bg-transparent hover:bg-brand/10"
                                }`}>
                            Dia
                        </button>

                        <button
                            onClick={() => setVisualizacao("mes")}
                            className={`flex-1 rounded-2xl py-2 cursor-pointer transition-all
                            ${visualizacao === "mes"
                                    ? "bg-brand text-white"
                                    : "border border-brand text-brand bg-transparent hover:bg-brand/10"
                                }`}>
                            Mês
                        </button>
                    </div>
                </div>
            </div>

            <ModalNovoAgendamento
                isOpen={isOpen}
                onOpenChange={onOpenChange}
                onSuccess={onNovoAgendamento}
            />
        </div>
    )
}
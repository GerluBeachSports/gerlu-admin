import { useState } from "react"
import { CalendarDate, today, getLocalTimeZone } from "@internationalized/date"
import { useAgendamentos, useResumoDia } from "../../hooks/agendamentos/useAgendamentos"
import { useRecurringNoMes } from "../../hooks/agendamentos/useRecurringNoMes"
import { ControleExibicao } from "./components/ControleExibicao"
import { AgendamentosDia } from "./components/AgendamentosDia"
import { AgendamentosMes } from "./components/AgendamentosMes"

export function AgendamentosPage() {
    const [dataSelecionada, setDataSelecionada] = useState<CalendarDate>(
        today(getLocalTimeZone())
    )

    const [visualizacao, setVisualizacao] = useState<"dia" | "mes">("dia")
    const { agendamentos, loading, error, refetch } = useAgendamentos(dataSelecionada)
    const { recurringPorDia, refetch: refetchRecurring } = useRecurringNoMes(dataSelecionada)

    const resumoDia = useResumoDia(agendamentos)

    function handleRefetch() {
        refetch()
        refetchRecurring()
    }

    // Recurring do dia selecionado
    const dataISO = dataSelecionada.toString()
    const recurringDoDia = recurringPorDia[dataISO] ?? []

    return (
        <main className="px-12 pb-12 mt-10">
            <div className="flex flex-col-reverse md:flex-row md:items-start items-center">
                <div className="sticky top-10 shrink-0 mt-10 lg:mt-0">
                    <ControleExibicao
                        dataSelecionada={dataSelecionada}
                        setDataSelecionada={setDataSelecionada}
                        visualizacao={visualizacao}
                        setVisualizacao={setVisualizacao}
                        onNovoAgendamento={handleRefetch}
                        quantidade={resumoDia.quantidade}
                        faturamento={resumoDia.faturamento}
                    />
                </div>

                <div className="flex-1 md:pl-4">
                    {visualizacao === "dia" && (
                        <AgendamentosDia
                            dataSelecionada={dataSelecionada}
                            setDataSelecionada={setDataSelecionada}
                            agendamentos={agendamentos}
                            recurringDoDia={recurringDoDia}
                            loading={loading}
                            error={error}
                            onRefetch={handleRefetch}
                        />
                    )}

                    {visualizacao === "mes" && (
                        <AgendamentosMes
                            dataSelecionada={dataSelecionada}
                            setDataSelecionada={setDataSelecionada}
                            setVisualizacao={setVisualizacao}
                            recurringPorDia={recurringPorDia}
                        />
                    )}
                </div>
            </div>


        </main>
    )
}
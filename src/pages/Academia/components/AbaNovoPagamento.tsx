import { useState } from "react"
import { Calendar, Input, type DateValue } from "@heroui/react"
import { CalendarDate } from "@internationalized/date"
import { HugeiconsIcon } from "@hugeicons/react"
import { Cancel01Icon } from "@hugeicons/core-free-icons"
import { supabase } from "../../../lib/supabase"
import { uploadComprovante } from "../../../hooks/useCloudinary"
import { type Aluno } from "../../../hooks/academia/useAlunos"

interface Props {
    aluno: Aluno | null
    onSuccess?: () => void
}

export function AbaNovoPagamento({ aluno, onSuccess }: Props) {
    const [valor, setValor] = useState("0")
    const [dataPagamento, setDataPagamento] = useState<CalendarDate | null>(null)
    const [dataVencimento, setDataVencimento] = useState<CalendarDate | null>(null)
    const [comprovante, setComprovante] = useState<File | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleValorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const apenasDigitos = e.target.value.replace(/\D/g, "")
        const numero = apenasDigitos.replace(/^0+/, "") || "0"
        setValor(numero)
    }

    const formatarValor = (v: string) => {
        const padded = v.padStart(3, "0")
        const reais = padded.slice(0, -2)
        const centavos = padded.slice(-2)
        return `${Number(reais).toLocaleString("pt-BR")},${centavos}`
    }

    const formatarData = (data: CalendarDate | null) => {
        if (!data) return "Não selecionada"
        return `${String(data.day).padStart(2, "0")}/${String(data.month).padStart(2, "0")}/${data.year}`
    }

    const valorNumerico = parseFloat(`${valor.slice(0, -2) || '0'}.${valor.slice(-2).padStart(2, '0')}`)
    const podeSalvar = dataPagamento && dataVencimento && valorNumerico > 0

    function resetar() {
        setValor("0")
        setDataPagamento(null)
        setDataVencimento(null)
        setComprovante(null)
        setError(null)
    }

    async function handleSalvar() {
        if (!aluno || !podeSalvar) return
        setLoading(true)
        setError(null)

        let receiptUrl: string | null = null

        if (comprovante) {
            receiptUrl = await uploadComprovante(comprovante)
            if (!receiptUrl) {
                setError('Erro ao enviar comprovante.')
                setLoading(false)
                return
            }
        }

        const { error: err } = await supabase
            .from('gym_payments')
            .insert({
                member_id: aluno.id,
                amount: valorNumerico,
                paid_at: dataPagamento!.toString(),
                due_date: dataVencimento!.toString(),
                payment_receipt_url: receiptUrl,
            })

        if (err) {
            setError('Erro ao salvar pagamento.')
            setLoading(false)
            return
        }

        resetar()
        onSuccess?.()
        setLoading(false)
    }

    return (
        <div className="flex flex-col lg:flex-row justify-between gap-y-10">
            <div className="grid lg:grid-cols-2 gap-x-4 gap-y-4">
                <div className="flex flex-col items-center gap-y-1">
                    <p className="text-center">Data de Pagamento</p>
                    <Calendar
                        aria-label="Data de Pagamento"
                        onChange={(v: DateValue) => setDataPagamento(v as CalendarDate)}
                        classNames={{ cellButton: "data-[selected=true]:bg-brand data-[selected=true]:text-white" }}
                    />
                </div>

                <div className="flex flex-col items-center gap-y-1">
                    <p className="text-center">Data de Vencimento</p>
                    <Calendar
                        aria-label="Data de Vencimento"
                        onChange={(v: DateValue) => setDataVencimento(v as CalendarDate)}
                        classNames={{ cellButton: "data-[selected=true]:bg-brand data-[selected=true]:text-white" }}
                    />
                </div>

                <div>
                    <p>Valor da mensalidade</p>
                    <Input
                        placeholder="0,00"
                        aria-label="Valor da mensalidade"
                        type="text"
                        inputMode="numeric"
                        value={formatarValor(valor)}
                        onChange={handleValorChange}
                        startContent={<span className="text-gray-500 text-sm select-none">R$</span>}
                        classNames={{
                            innerWrapper: "flex items-center gap-2 bg-lightblue py-3 px-4 rounded-xl",
                            input: "text-sm focus:outline-none border-transparent focus:border-transparent focus:ring-0",
                            inputWrapper: "p-0",
                        }}
                    />
                </div>

                <div>
                    <p>Anexar Comprovante</p>
                    {comprovante ? (
                        <div className="rounded-xl border w-full border-brand px-1.5 py-2 flex items-center justify-between gap-2">
                            <p className="text-sm truncate max-w-60 lg:max-w-50">{comprovante.name}</p>
                            <button onClick={() => setComprovante(null)} className="text-gray-400 hover:text-red-500 transition-colors cursor-pointer shrink-0">
                                <HugeiconsIcon icon={Cancel01Icon} size={16} />
                            </button>
                        </div>
                    ) : (
                        <label className="rounded-xl border w-full border-brand px-1.5 py-2 cursor-pointer hover:bg-brandsecondary/30 transition-all duration-200 flex items-center justify-center">
                            <p className="text-sm">Anexar comprovante aqui</p>
                            <input type="file" accept=".png,.jpeg,.jpg,.pdf" className="hidden"
                                onChange={(e) => { const f = e.target.files?.[0]; if (f) setComprovante(f) }}
                            />
                        </label>
                    )}
                </div>
            </div>

            <div className="hidden lg:block bg-gray-300 w-0.5 rounded-3xl" />

            <div className="space-y-4">
                <div>
                    <p>Informações do novo pagamento</p>
                    <div className="bg-brand text-white text-sm rounded-2xl p-4 lg:min-w-90 mt-1 space-y-1">
                        <p>Aluno: <span className="font-semibold">{aluno?.nome ?? '—'}</span></p>
                        <p>Data de Pagamento: <span className="font-semibold">{formatarData(dataPagamento)}</span></p>
                        <p>Data de Vencimento: <span className="font-semibold">{formatarData(dataVencimento)}</span></p>
                        <p>Valor: <span className="font-semibold">{valorNumerico > 0 ? `R$ ${formatarValor(valor)}` : 'Não informado'}</span></p>
                        <p className={`mt-4 ${comprovante ? 'text-green-300' : 'text-red-300'}`}>
                            {comprovante ? 'Comprovante anexado' : 'Comprovante não anexado'}
                        </p>
                    </div>
                </div>

                {error && <p className="text-red-500 text-sm">{error}</p>}

                <div className="flex justify-end">
                    <button
                        className="button-g py-2 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={!podeSalvar || loading}
                        onClick={handleSalvar}
                    >
                        {loading ? 'Salvando...' : 'Salvar'}
                    </button>
                </div>
            </div>
        </div>
    )
}
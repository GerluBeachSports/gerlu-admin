import { useState, useEffect } from 'react'
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Input } from "@heroui/react"
import { Calendar, type DateValue } from "@heroui/react"
import { CalendarDate } from "@internationalized/date"
import { HugeiconsIcon } from "@hugeicons/react"
import { Cancel01Icon } from "@hugeicons/core-free-icons"
import { uploadComprovante } from "../../../hooks/useCloudinary"
import { type Pagamento } from "../../../hooks/academia/usePagamentosAluno"

interface Props {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  pagamento: Pagamento | null
  onSalvar: (id: string, dados: { amount: number; paid_at: string; due_date: string; payment_receipt_url?: string | null }) => Promise<boolean>
}

function parseCalendarDate(dateStr: string): CalendarDate {
  const [ano, mes, dia] = dateStr.split('T')[0].split('-').map(Number)
  return new CalendarDate(ano, mes, dia)
}

export function ModalEditarPagamento({ isOpen, onOpenChange, pagamento, onSalvar }: Props) {
  const [valor, setValor] = useState("0")
  const [dataPagamento, setDataPagamento] = useState<CalendarDate | null>(null)
  const [dataVencimento, setDataVencimento] = useState<CalendarDate | null>(null)
  const [comprovante, setComprovante] = useState<File | null>(null)
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (pagamento) {
      // Converte amount para centavos como string
      const centavos = Math.round(pagamento.amount * 100).toString()
      setValor(centavos)
      setDataPagamento(parseCalendarDate(pagamento.paid_at))
      setDataVencimento(parseCalendarDate(pagamento.due_date))
      setReceiptUrl(pagamento.payment_receipt_url)
      setComprovante(null)
    }
  }, [pagamento])

  const formatarValor = (v: string) => {
    const padded = v.padStart(3, "0")
    const reais = padded.slice(0, -2)
    const centavos = padded.slice(-2)
    return `${Number(reais).toLocaleString("pt-BR")},${centavos}`
  }

  const handleValorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const apenasDigitos = e.target.value.replace(/\D/g, "")
    const numero = apenasDigitos.replace(/^0+/, "") || "0"
    setValor(numero)
  }

  const valorNumerico = parseFloat(`${valor.slice(0, -2) || '0'}.${valor.slice(-2).padStart(2, '0')}`)
  const podeSalvar = dataPagamento && dataVencimento && valorNumerico > 0

  async function handleSalvar() {
    if (!pagamento || !podeSalvar) return
    setLoading(true)
    setError(null)

    let urlFinal = receiptUrl

    if (comprovante) {
      const uploaded = await uploadComprovante(comprovante)
      if (!uploaded) {
        setError('Erro ao enviar comprovante.')
        setLoading(false)
        return
      }
      urlFinal = uploaded
    }

    const ok = await onSalvar(pagamento.id, {
      amount: valorNumerico,
      paid_at: dataPagamento!.toString(),
      due_date: dataVencimento!.toString(),
      payment_receipt_url: urlFinal,
    })

    if (!ok) {
      setError('Erro ao salvar pagamento.')
      setLoading(false)
      return
    }

    setLoading(false)
    onOpenChange(false)
  }

  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      placement="center"
      size="2xl"
      classNames={{
        wrapper: "px-4",
        closeButton: "text-white hover:bg-white/40 cursor-pointer p-1"
      }}
    >
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex justify-center gradient-background text-white">
              Editar Pagamento
            </ModalHeader>

            <ModalBody className="mt-4">
              <div className="grid lg:grid-cols-2 gap-x-4 gap-y-4">
                <div className="flex flex-col items-center gap-y-1">
                  <p className="text-center text-sm">Data de Pagamento</p>
                  {dataPagamento && (
                    <Calendar
                      aria-label="Data de Pagamento"
                      value={dataPagamento}
                      onChange={(v: DateValue) => setDataPagamento(v as CalendarDate)}
                      classNames={{ cellButton: "data-[selected=true]:bg-brand data-[selected=true]:text-white" }}
                    />
                  )}
                </div>

                <div className="flex flex-col items-center gap-y-1">
                  <p className="text-center text-sm">Data de Vencimento</p>
                  {dataVencimento && (
                    <Calendar
                      aria-label="Data de Vencimento"
                      value={dataVencimento}
                      onChange={(v: DateValue) => setDataVencimento(v as CalendarDate)}
                      classNames={{ cellButton: "data-[selected=true]:bg-brand data-[selected=true]:text-white" }}
                    />
                  )}
                </div>

                <div>
                  <p className="text-sm mb-1">Valor da mensalidade</p>
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
                  <p className="text-sm mb-1">Comprovante</p>
                  {comprovante ? (
                    <div className="rounded-xl border w-full border-brand px-1.5 py-2 flex items-center justify-between gap-2">
                      <p className="text-sm truncate max-w-60">{comprovante.name}</p>
                      <button onClick={() => setComprovante(null)} className="text-gray-400 hover:text-red-500 transition-colors cursor-pointer shrink-0">
                        <HugeiconsIcon icon={Cancel01Icon} size={16} />
                      </button>
                    </div>
                  ) : receiptUrl ? (
                    <div className="rounded-xl border w-full border-brand px-1.5 py-2 flex items-center justify-between gap-2">
                      <p className="text-sm text-brand truncate">Comprovante anexado</p>
                      <button onClick={() => setReceiptUrl(null)} className="text-gray-400 hover:text-red-500 transition-colors cursor-pointer shrink-0">
                        <HugeiconsIcon icon={Cancel01Icon} size={16} />
                      </button>
                    </div>
                  ) : (
                    <label className="rounded-xl border w-full border-brand px-1.5 py-2 cursor-pointer hover:bg-brandsecondary/30 transition-all duration-200 flex items-center justify-center">
                      <p className="text-sm">Anexar comprovante</p>
                      <input
                        type="file"
                        accept=".png,.jpeg,.jpg,.pdf"
                        className="hidden"
                        onChange={(e) => { const f = e.target.files?.[0]; if (f) setComprovante(f) }}
                      />
                    </label>
                  )}
                </div>
              </div>

              {error && <p className="text-red-500 text-sm text-center mt-2">{error}</p>}
            </ModalBody>

            <ModalFooter className="flex justify-between">
              <button onClick={onClose} className="cancel-button">Cancelar</button>
              <button
                className="confirm-button disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!podeSalvar || loading}
                onClick={handleSalvar}
              >
                {loading ? 'Salvando...' : 'Salvar'}
              </button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  )
}
import { useEffect, useState } from "react"
import {
  Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button,
} from "@heroui/react"
import { type Produto } from "../../../hooks/produtos/useProdutosAdmin"

interface Props {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  produto: Produto | null // null = modo criação, Produto = modo edição
  onSalvar: (name: string, price: number) => Promise<boolean>
  salvando: boolean
}

export function ModalProduto({ isOpen, onOpenChange, produto, onSalvar, salvando }: Props) {
  const [name, setName] = useState("")
  const [digitos, setDigitos] = useState("")

  // Converte os dígitos para valor numérico (ex: "990" → 9.90)
  const valorNumerico = parseInt(digitos || "0") / 100

  const precoFormatado = valorNumerico.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  })

  function handleDigitos(e: React.ChangeEvent<HTMLInputElement>) {
    // Mantém apenas números e limita a 7 dígitos (R$ 99.999,99)
    const apenasNumeros = e.target.value.replace(/\D/g, "").slice(0, 7)
    setDigitos(apenasNumeros)
  }
  const [erroLocal, setErroLocal] = useState<string | null>(null)

  const modoEdicao = produto !== null

  // Preenche os campos ao abrir em modo edição
  useEffect(() => {
    if (isOpen) {
      setName(produto?.name ?? "")
      // Converte o preço salvo de volta para dígitos (ex: 9.90 → "990")
      setDigitos(produto ? Math.round(produto.price * 100).toString() : "")
      setErroLocal(null)
    }
  }, [isOpen, produto])

  async function handleSalvar() {
    setErroLocal(null)

    if (!name.trim()) {
      setErroLocal("Nome é obrigatório.")
      return
    }

    if (valorNumerico <= 0) {
      setErroLocal("Informe um preço válido.")
      return
    }

    const ok = await onSalvar(name, valorNumerico)
    if (ok) onOpenChange(false)
  }

  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange} placement="center" hideCloseButton>
      <ModalContent>
        <>
          <ModalHeader className="bg-brand rounded-t-xl">
            <h2 className="text-white font-montserrat text-lg font-bold w-full text-center">
              {modoEdicao ? "Editar Produto" : "Novo Produto"}
            </h2>
          </ModalHeader>

          <ModalBody className="py-6 px-6 space-y-4">
            {/* Nome */}
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-600">Nome</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Ex: Coca-Cola"
                className="border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-brand transition-colors"
              />
            </div>

            {/* Preço — estilo banco (direita para esquerda) */}
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-600">Preço</label>
              <div className="relative border border-gray-200 rounded-xl focus-within:border-brand transition-colors">
                <input
                  type="text"
                  inputMode="numeric"
                  value={digitos}
                  onChange={handleDigitos}
                  className="w-full px-3 py-2 text-sm outline-none bg-transparent opacity-0 absolute inset-0"
                />
                <div className="px-3 py-2 text-sm font-semibold text-gray-700 pointer-events-none">
                  {precoFormatado}
                </div>
              </div>
            </div>

            {erroLocal && (
              <p className="text-xs text-red-500">{erroLocal}</p>
            )}
          </ModalBody>

          <ModalFooter className="flex gap-3">
            <Button
              variant="bordered"
              className="flex-1 rounded-xl border-brand text-brand font-semibold"
              onPress={() => onOpenChange(false)}
              isDisabled={salvando}
            >
              Cancelar
            </Button>
            <Button
              className="flex-1 rounded-xl bg-brand text-white font-semibold"
              isLoading={salvando}
              onPress={handleSalvar}
            >
              {modoEdicao ? "Salvar" : "Criar"}
            </Button>
          </ModalFooter>
        </>
      </ModalContent>
    </Modal>
  )
}
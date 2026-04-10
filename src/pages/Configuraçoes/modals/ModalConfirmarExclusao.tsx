import { useState } from 'react'
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button } from '@heroui/react'

interface Props {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  nomeQuadra: string
  onConfirmar: () => Promise<boolean>
}

export function ModalConfirmarExclusao({ isOpen, onOpenChange, nomeQuadra, onConfirmar }: Props) {
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  async function handleConfirmar(onClose: () => void) {
    setLoading(true)
    setErro(null)
    const ok = await onConfirmar()
    setLoading(false)
    if (ok) onClose()
    else setErro('Erro ao excluir. Tente novamente.')
  }

  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange} placement="center" hideCloseButton>
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="bg-red-500 rounded-t-xl">
              <h2 className="text-white font-montserrat text-lg font-bold w-full text-center">
                Excluir Quadra
              </h2>
            </ModalHeader>

            <ModalBody className="py-6 px-6 text-center space-y-2">
              <p className="text-gray-700">Tem certeza que deseja excluir</p>
              <p className="font-semibold text-gray-900">"{nomeQuadra}"?</p>
              <p className="text-sm text-gray-400 mt-1">
                Todos os agendamentos e esportes vinculados a esta quadra também serão removidos. Esta ação não pode ser desfeita.
              </p>
              {erro && <p className="text-xs text-red-500">{erro}</p>}
            </ModalBody>

            <ModalFooter className="flex gap-3">
              <Button
                variant="bordered"
                className="flex-1 rounded-xl font-semibold border-brand text-brand"
                onPress={onClose}
                isDisabled={loading}
              >
                Cancelar
              </Button>
              <Button
                color="danger"
                className="flex-1 rounded-xl font-semibold bg-red-500"
                isLoading={loading}
                onPress={() => handleConfirmar(onClose)}
              >
                Excluir
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  )
}
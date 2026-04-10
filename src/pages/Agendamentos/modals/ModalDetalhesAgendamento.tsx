import { HugeiconsIcon } from "@hugeicons/react"
import {
    Calendar01Icon,
    Time02Icon,
    UserCircleIcon,
    Call02Icon,
    Money03Icon,
    TennisBallIcon,
    FootballIcon,
    VolleyballIcon,
    DashedLineCircleIcon,
    AlbumNotFound01Icon,
    Circle,
    BadmintonShuttleIcon,
    Location01Icon,
} from "@hugeicons/core-free-icons"
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button } from "@heroui/react"
import { useState } from "react"
import { supabase } from "../../../lib/supabase"
import { type Agendamento } from "../../../hooks/agendamentos/useAgendamentos"

interface Props {
    agendamento: Agendamento | null
    isOpen: boolean
    onOpenChange: (open: boolean) => void
    onCancelSuccess: () => void
}

function getIconeEsporte(nomeEsporte: string) {
    switch (nomeEsporte) {
        case 'Queimada': return Circle
        case 'Peteca': return BadmintonShuttleIcon
        case 'Futvôlei': return FootballIcon
        case 'Beach Tennis': return TennisBallIcon
        case 'Vôlei': return VolleyballIcon
        default: return DashedLineCircleIcon
    }
}

export function ModalDetalhesAgendamento({ agendamento, isOpen, onOpenChange, onCancelSuccess }: Props) {
    const [cancelando, setCancelando] = useState(false)
    const [erro, setErro] = useState<string | null>(null)

    if (!agendamento) return null

    const iconeEsporte = getIconeEsporte(agendamento.esporte.name)

    const dataFormatada = new Date(agendamento.booking_start).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
    })

    const horaFormatada = new Date(agendamento.booking_start).toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
    })

    const telefoneFormatado = agendamento.usuario.phone
        ? agendamento.usuario.phone.replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3')
        : '—'

    const precoFormatado = agendamento.price.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    })

    async function handleCancelar(onClose: () => void) {
        setCancelando(true)
        setErro(null)

        const { error } = await supabase
            .from('bookings')
            .delete()
            .eq('id', agendamento!.id)

        setCancelando(false)

        if (error) {
            setErro('Erro ao cancelar o agendamento. Tente novamente.')
            return
        }

        onClose()
        onCancelSuccess()
    }

    return (
        <Modal
            isOpen={isOpen}
            onOpenChange={onOpenChange}
            placement="center"
            classNames={{
                wrapper: "px-4",
                closeButton: "text-white hover:bg-white/40 cursor-pointer p-1"
            }}
        >
            <ModalContent>
                {(onClose) => (
                    <>
                        <ModalHeader className="flex justify-center gradient-background text-white">
                            Novo Agendamento
                        </ModalHeader>

                        <ModalBody className="py-6 px-6 space-y-4">
                            {/* Quadra — imagem */}
                            <div className="w-full h-36 rounded-xl overflow-hidden bg-gray-100 flex items-center justify-center">
                                {agendamento.quadra.image_url ? (
                                    <img
                                        src={agendamento.quadra.image_url}
                                        alt={agendamento.quadra.name}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="flex flex-col items-center gap-1 text-gray-400">
                                        <HugeiconsIcon icon={AlbumNotFound01Icon} size={36} />
                                        <span className="text-xs">{agendamento.quadra.name}</span>
                                    </div>
                                )}
                            </div>

                            {/* Data e hora */}
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2">
                                    <HugeiconsIcon icon={Calendar01Icon} size={20} className="text-brand shrink-0" />
                                    <span className="text-sm">{dataFormatada}</span>
                                </div>
                                <span className="text-gray-300">|</span>
                                <div className="flex items-center gap-2">
                                    <HugeiconsIcon icon={Time02Icon} size={20} className="text-brand shrink-0" />
                                    <span className="text-sm">{horaFormatada}</span>
                                </div>
                            </div>

                            {/* Usuário e telefone */}
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2">
                                    <HugeiconsIcon icon={UserCircleIcon} size={20} className="text-brand shrink-0" />
                                    <span className="text-sm">{agendamento.usuario.fullname}</span>
                                </div>
                                <span className="text-gray-300">|</span>
                                <div className="flex items-center gap-2">
                                    <HugeiconsIcon icon={Call02Icon} size={20} className="text-brand shrink-0" />
                                    <span className="text-sm">{telefoneFormatado}</span>
                                </div>
                            </div>

                            {/* Quadra e esporte */}
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2">
                                    <HugeiconsIcon icon={Location01Icon} size={20} className="text-brand shrink-0" />
                                    <span className="text-sm">{agendamento.quadra.name}</span>
                                </div>
                                <span className="text-gray-300">|</span>
                                <div className="flex items-center gap-2">
                                    <HugeiconsIcon icon={iconeEsporte} size={20} className="text-brand shrink-0" />
                                    <span className="text-sm">{agendamento.esporte.name}</span>
                                </div>
                            </div>

                            {/* Preço */}
                            <div className="flex items-center gap-2">
                                <HugeiconsIcon icon={Money03Icon} size={20} className="text-brand shrink-0" />
                                <span className="text-sm font-semibold">{precoFormatado}</span>
                            </div>

                            {erro && (
                                <p className="text-xs text-red-500">{erro}</p>
                            )}
                        </ModalBody>

                        <ModalFooter className="flex gap-3">
                            <Button
                                variant="bordered"
                                color="danger"
                                className="flex-1 rounded-xl font-semibold"
                                isLoading={cancelando}
                                onPress={() => handleCancelar(onClose)}
                            >
                                Cancelar horário
                            </Button>
                            <Button
                                className="flex-1 rounded-xl bg-brand text-white font-semibold"
                                onPress={onClose}
                            >
                                Ok
                            </Button>
                        </ModalFooter>
                    </>
                )}
            </ModalContent>
        </Modal>
    )
}
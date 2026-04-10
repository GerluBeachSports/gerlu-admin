import { useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
    Calendar01Icon,
    Time02Icon,
    UserCircleIcon,
    Call02Icon,
    Money03Icon,
    TennisBallIcon,
    VolleyballIcon,
    FootballIcon,
    DashedLineCircleIcon,
    Circle,
    BadmintonShuttleIcon,
    AlbumNotFound01Icon,
} from "@hugeicons/core-free-icons"
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button } from "@heroui/react"
import { useNovoAgendamento } from "../../../hooks/agendamentos/useNovoAgendamento"

export interface DadosConfirmacao {
    fullname: string
    phone: string
    telefoneFormatado: string
    court_sport_id: string
    horario: string
    slotDurationMinutes: number
    price: number
    quadraNome: string
    quadraImageUrl: string | null
    esporteNome: string
}

interface Props {
    isOpen: boolean
    onOpenChange: (open: boolean) => void
    dados: DadosConfirmacao | null
    onVoltar: () => void
    onSuccess: () => void
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

function formatarDuracao(minutos: number): string {
    if (minutos < 120) return `${minutos} min`
    return `${minutos / 60}h`
}

export function ModalConfirmarAgendamento({ isOpen, onOpenChange, dados, onVoltar, onSuccess }: Props) {
    const { criarAgendamento, loading, error } = useNovoAgendamento()
    const [erro, setErro] = useState<string | null>(null)

    if (!dados) return null

    const iconeEsporte = getIconeEsporte(dados.esporteNome)

    const dataFormatada = new Date(dados.horario).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
    })

    const horaFormatada = new Date(dados.horario).toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
    })

    const precoFormatado = dados.price.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    })

    async function handleConfirmar() {
        setErro(null)
        const ok = await criarAgendamento({
            fullname: dados!.fullname,
            phone: dados!.phone,
            court_sport_id: dados!.court_sport_id,
            horario: dados!.horario,
            slotDurationMinutes: dados!.slotDurationMinutes,
            price: dados!.price,
        })

        if (!ok) {
            setErro('Erro ao confirmar agendamento. Tente novamente.')
            return
        }

        onSuccess()
    }

    return (
        <Modal isOpen={isOpen} onOpenChange={onOpenChange} placement="center" hideCloseButton>
            <ModalContent>
                <>
                    <ModalHeader className="bg-brand rounded-t-xl">
                        <h2 className="text-white font-montserrat text-lg font-bold w-full text-center">
                            Confirmar Agendamento
                        </h2>
                    </ModalHeader>

                    <ModalBody className="py-6 px-6 space-y-4">
                        {/* Imagem da quadra */}
                        <div className="w-full h-36 rounded-xl overflow-hidden bg-gray-100 flex items-center justify-center">
                            {dados.quadraImageUrl ? (
                                <img
                                    src={dados.quadraImageUrl}
                                    alt={dados.quadraNome}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="flex flex-col items-center gap-1 text-gray-400">
                                    <HugeiconsIcon icon={AlbumNotFound01Icon} size={36} />
                                    <span className="text-xs">{dados.quadraNome}</span>
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
                                <span className="text-sm">
                                    {horaFormatada}
                                    <span className="text-gray-400 ml-1">
                                        ({formatarDuracao(dados.slotDurationMinutes)})
                                    </span>
                                </span>
                            </div>
                        </div>

                        {/* Usuário e telefone */}
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                                <HugeiconsIcon icon={UserCircleIcon} size={20} className="text-brand shrink-0" />
                                <span className="text-sm">{dados.fullname}</span>
                            </div>
                            <span className="text-gray-300">|</span>
                            <div className="flex items-center gap-2">
                                <HugeiconsIcon icon={Call02Icon} size={20} className="text-brand shrink-0" />
                                <span className="text-sm">{dados.telefoneFormatado}</span>
                            </div>
                        </div>

                        {/* Quadra e esporte */}
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                                <HugeiconsIcon icon={UserCircleIcon} size={20} className="text-brand shrink-0" />
                                <span className="text-sm">{dados.quadraNome}</span>
                            </div>
                            <span className="text-gray-300">|</span>
                            <div className="flex items-center gap-2">
                                <HugeiconsIcon icon={iconeEsporte} size={20} className="text-brand shrink-0" />
                                <span className="text-sm">{dados.esporteNome}</span>
                            </div>
                        </div>

                        {/* Preço */}
                        <div className="flex items-center gap-2">
                            <HugeiconsIcon icon={Money03Icon} size={20} className="text-brand shrink-0" />
                            <span className="text-sm font-semibold">{precoFormatado}</span>
                        </div>

                        {(erro || error) && (
                            <p className="text-xs text-red-500">{erro ?? error}</p>
                        )}
                    </ModalBody>

                    <ModalFooter className="flex gap-3">
                        <Button
                            variant="bordered"
                            className="flex-1 rounded-xl font-semibold border-brand text-brand"
                            onPress={onVoltar}
                            isDisabled={loading}
                        >
                            Voltar
                        </Button>
                        <Button
                            className="flex-1 rounded-xl bg-brand text-white font-semibold"
                            isLoading={loading}
                            onPress={handleConfirmar}
                        >
                            Confirmar
                        </Button>
                    </ModalFooter>
                </>
            </ModalContent>
        </Modal>
    )
}
import { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Calendar01Icon,
  Time02Icon,
  UserCircleIcon,
  Call02Icon,
  Money03Icon,
  AlbumNotFound01Icon,
  Location01Icon,
  WavingHand01Icon,
} from "@hugeicons/core-free-icons";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
} from "@heroui/react";
import { useNovoEvento } from "../../../hooks/eventos/useNovoEvento";

export interface DadosConfirmacaoEvento {
  fullname: string;
  phone: string;
  telefoneFormatado: string;
  booking_type: "single_court" | "full_venue";
  court_id: string | null;
  include_sauna_pool: boolean;
  event_date: string;
  booking_start: string;
  booking_end: string;
  price: number;
  quadraNome: string | null;
  quadraImageUrl: string | null;
}

interface Props {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  dados: DadosConfirmacaoEvento | null;
  onVoltar: () => void;
  onSuccess: () => void;
}

export function ModalConfirmarEvento({
  isOpen,
  onOpenChange,
  dados,
  onVoltar,
  onSuccess,
}: Props) {
  const { criarEvento, loading, error } = useNovoEvento();
  const [erro, setErro] = useState<string | null>(null);

  if (!dados) return null;

  const dataFormatada = new Date(dados.event_date + "T12:00:00").toLocaleDateString(
    "pt-BR",
    { day: "2-digit", month: "long", year: "numeric" }
  );

  const horaInicio = dados.booking_start.split("T")[1]?.slice(0, 5) ?? "—";
  const horaFim = dados.booking_end.split("T")[1]?.slice(0, 5) ?? "—";

  const precoFormatado = dados.price.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

  const tipoLabel =
    dados.booking_type === "full_venue" ? "Espaço Inteiro" : "Quadra Individual";

  async function handleConfirmar() {
    setErro(null);
    const ok = await criarEvento({
      fullname: dados!.fullname,
      phone: dados!.phone,
      booking_type: dados!.booking_type,
      court_id: dados!.court_id,
      include_sauna_pool: dados!.include_sauna_pool,
      event_date: dados!.event_date,
      booking_start: dados!.booking_start,
      booking_end: dados!.booking_end,
      price: dados!.price,
    });

    if (!ok) {
      setErro("Erro ao confirmar evento. Tente novamente.");
      return;
    }

    onSuccess();
  }

  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange} placement="center" hideCloseButton>
      <ModalContent>
        <>
          <ModalHeader className="bg-brand rounded-t-xl">
            <h2 className="text-white font-montserrat text-lg font-bold w-full text-center">
              Confirmar Evento
            </h2>
          </ModalHeader>

          <ModalBody className="py-6 px-6 space-y-4">
            {/* Imagem da quadra ou banner de espaço inteiro */}
            <div className="w-full h-36 rounded-xl overflow-hidden bg-gray-100 flex items-center justify-center">
              {dados.booking_type === "full_venue" ? (
                <div className="flex flex-col items-center gap-2 text-brand">
                  <HugeiconsIcon icon={WavingHand01Icon} size={40} />
                  <span className="text-sm font-semibold">Espaço Inteiro</span>
                </div>
              ) : dados.quadraImageUrl ? (
                <img
                  src={dados.quadraImageUrl}
                  alt={dados.quadraNome ?? "Quadra"}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex flex-col items-center gap-1 text-gray-400">
                  <HugeiconsIcon icon={AlbumNotFound01Icon} size={36} />
                  <span className="text-xs">{dados.quadraNome ?? "—"}</span>
                </div>
              )}
            </div>

            {/* Data */}
            <div className="flex items-center gap-2">
              <HugeiconsIcon icon={Calendar01Icon} size={20} className="text-brand shrink-0" />
              <span className="text-sm">{dataFormatada}</span>
            </div>

            {/* Horário */}
            <div className="flex items-center gap-2">
              <HugeiconsIcon icon={Time02Icon} size={20} className="text-brand shrink-0" />
              <span className="text-sm">
                {horaInicio} — {horaFim}
              </span>
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

            {/* Tipo e quadra */}
            <div className="flex items-center gap-2">
              <HugeiconsIcon icon={Location01Icon} size={20} className="text-brand shrink-0" />
              <span className="text-sm">
                {tipoLabel}
                {dados.quadraNome && ` — ${dados.quadraNome}`}
              </span>
            </div>

            {/* Sauna + Piscina */}
            {dados.include_sauna_pool && (
              <div className="bg-brand/10 rounded-xl px-4 py-2">
                <span className="text-sm text-brand font-medium">
                  + Sauna & Piscina incluídos
                </span>
              </div>
            )}

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
  );
}
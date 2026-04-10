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
import { useState } from "react";
import { supabase } from "../../../lib/supabase";
import { type Evento } from "../../../hooks/eventos/useEventos";

interface Props {
  evento: Evento | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onCancelSuccess: () => void;
}

export function ModalDetalhesEvento({
  evento,
  isOpen,
  onOpenChange,
  onCancelSuccess,
}: Props) {
  const [cancelando, setCancelando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  if (!evento) return null;

  const dataFormatada = new Date(evento.event_date + "T12:00:00").toLocaleDateString(
    "pt-BR",
    { day: "2-digit", month: "long", year: "numeric" }
  );

  const horaInicio = evento.booking_start.split("T")[1]?.slice(0, 5) ?? "—";
  const horaFim = evento.booking_end.split("T")[1]?.slice(0, 5) ?? "—";

  const telefoneFormatado = evento.usuario.phone
    ? evento.usuario.phone.replace(/^(\d{2})(\d{5})(\d{4})$/, "($1) $2-$3")
    : "—";

  const precoFormatado = evento.price.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

  const tipoLabel =
    evento.booking_type === "full_venue" ? "Espaço Inteiro" : "Quadra Individual";

  async function handleCancelar(onClose: () => void) {
    setCancelando(true);
    setErro(null);

    const { error } = await supabase
      .from("events")
      .delete()
      .eq("id", evento!.id);

    setCancelando(false);

    if (error) {
      setErro("Erro ao cancelar o evento. Tente novamente.");
      return;
    }

    onClose();
    onCancelSuccess();
  }

  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      placement="center"
      classNames={{
        wrapper: "px-4",
        closeButton: "text-white hover:bg-white/40 cursor-pointer p-1",
      }}
    >
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex justify-center gradient-background text-white">
              Detalhes do Evento
            </ModalHeader>

            <ModalBody className="py-6 px-6 space-y-4">
              {/* Imagem ou banner */}
              <div className="w-full h-36 rounded-xl overflow-hidden bg-gray-100 flex items-center justify-center">
                {evento.booking_type === "full_venue" ? (
                  <div className="flex flex-col items-center gap-2 text-brand">
                    <HugeiconsIcon icon={WavingHand01Icon} size={40} />
                    <span className="text-sm font-semibold">Espaço Inteiro</span>
                  </div>
                ) : evento.quadra?.image_url ? (
                  <img
                    src={evento.quadra.image_url}
                    alt={evento.quadra.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-1 text-gray-400">
                    <HugeiconsIcon icon={AlbumNotFound01Icon} size={36} />
                    <span className="text-xs">{evento.quadra?.name ?? "—"}</span>
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
                  <span className="text-sm">{evento.usuario.fullname}</span>
                </div>
                <span className="text-gray-300">|</span>
                <div className="flex items-center gap-2">
                  <HugeiconsIcon icon={Call02Icon} size={20} className="text-brand shrink-0" />
                  <span className="text-sm">{telefoneFormatado}</span>
                </div>
              </div>

              {/* Tipo e quadra */}
              <div className="flex items-center gap-2">
                <HugeiconsIcon icon={Location01Icon} size={20} className="text-brand shrink-0" />
                <span className="text-sm">
                  {tipoLabel}
                  {evento.quadra?.name && ` — ${evento.quadra.name}`}
                </span>
              </div>

              {/* Sauna + Piscina */}
              {evento.include_sauna_pool && (
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

              {erro && <p className="text-xs text-red-500">{erro}</p>}
            </ModalBody>

            <ModalFooter className="flex gap-3">
              <Button
                variant="bordered"
                color="danger"
                className="flex-1 rounded-xl font-semibold"
                isLoading={cancelando}
                onPress={() => handleCancelar(onClose)}
              >
                Cancelar evento
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
  );
}
import { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  CircleArrowLeft01Icon,
  CircleArrowRight01Icon,
  UserCircleIcon,
  Location01Icon,
  WavingHand01Icon,
} from "@hugeicons/core-free-icons";
import { useDisclosure } from "@heroui/react";
import { CalendarDate, getLocalTimeZone } from "@internationalized/date";
import { type Evento } from "../../../hooks/eventos/useEventos";
import { ModalDetalhesEvento } from "../modals/ModalDetalhesEvento";

interface Props {
  dataSelecionada: CalendarDate;
  setDataSelecionada: (data: CalendarDate) => void;
  eventos: Evento[];
  loading: boolean;
  error: string | null;
  onRefetch: () => void;
}

const DIAS_SEMANA = [
  "Domingo",
  "Segunda-feira",
  "Terça-feira",
  "Quarta-feira",
  "Quinta-feira",
  "Sexta-feira",
  "Sábado",
];

interface CardEventoProps {
  evento: Evento;
  onClick: (evento: Evento) => void;
}

function CardEvento({ evento, onClick }: CardEventoProps) {
  const horaInicio = evento.booking_start.split("T")[1]?.slice(0, 5) ?? "—";
  const horaFim = evento.booking_end.split("T")[1]?.slice(0, 5) ?? "—";
  const isFull = evento.booking_type === "full_venue";

  return (
    <button className="card-day" onClick={() => onClick(evento)}>
      <div className="bg-brand rounded-t-2xl px-8 py-1.5 font-montserrat text-white">
        <p className="text-center text-sm">
          {horaInicio} — {horaFim}
        </p>
      </div>
      <div className="flex flex-col border-x-1 border-b-1 rounded-b-2xl border-brand justify-center py-2 px-1 gap-y-1">
        <div className="flex gap-x-2 items-center">
          <HugeiconsIcon icon={UserCircleIcon} size={24} />
          <p className="text-sm">{evento.usuario.fullname}</p>
        </div>
        <div className="flex gap-x-2 items-center">
          <HugeiconsIcon icon={isFull ? WavingHand01Icon : Location01Icon} size={24} />
          <p className="text-sm">
            {isFull ? "Espaço Inteiro" : (evento.quadra?.name ?? "—")}
          </p>
        </div>
        {evento.include_sauna_pool && (
          <p className="text-xs text-brand font-medium px-1">+ Sauna & Piscina</p>
        )}
      </div>
    </button>
  );
}

export function EventosDia({
  dataSelecionada,
  setDataSelecionada,
  eventos,
  loading,
  error,
  onRefetch,
}: Props) {
  const jsDate = dataSelecionada.toDate(getLocalTimeZone());
  const diaSemana = DIAS_SEMANA[jsDate.getDay()];
  const dataFormatada = dataSelecionada.toString().split("-").reverse().join("/");
  const isDomingo = jsDate.getDay() === 0;

  // Navega apenas entre domingos
  function avancarDomingo() {
    let next = dataSelecionada.add({ days: 1 });
    while (next.toDate(getLocalTimeZone()).getDay() !== 0) {
      next = next.add({ days: 1 });
    }
    setDataSelecionada(next);
  }

  function retrocederDomingo() {
    let prev = dataSelecionada.subtract({ days: 1 });
    while (prev.toDate(getLocalTimeZone()).getDay() !== 0) {
      prev = prev.subtract({ days: 1 });
    }
    setDataSelecionada(prev);
  }

  const detalhesModal = useDisclosure();
  const [eventoSelecionado, setEventoSelecionado] = useState<Evento | null>(null);

  function handleCardClick(ev: Evento) {
    setEventoSelecionado(ev);
    detalhesModal.onOpen();
  }

  return (
    <div className="w-full flex flex-col items-center md:block">
      <div className="flex flex-col items-center justify-center">
        <div className="grid grid-cols-[auto_1fr_auto] items-center gap-x-4">
          <button className="cursor-pointer" onClick={retrocederDomingo}>
            <HugeiconsIcon icon={CircleArrowLeft01Icon} />
          </button>
          <p className="font-montserrat font-bold text-brand text-center">
            {diaSemana}, {dataFormatada}
          </p>
          <button className="cursor-pointer" onClick={avancarDomingo}>
            <HugeiconsIcon icon={CircleArrowRight01Icon} />
          </button>
        </div>

        {!isDomingo && (
          <p className="text-xs text-gray-400 mt-1">
            Eventos acontecem apenas aos domingos
          </p>
        )}
      </div>

      <div className="mt-6 md:ml-12">
        {loading && (
          <p className="text-sm text-gray-400 animate-pulse">Carregando eventos...</p>
        )}

        {error && <p className="text-sm text-red-500">{error}</p>}

        {!loading && !error && !isDomingo && (
          <p className="text-sm text-gray-400">
            Selecione um domingo para ver os eventos.
          </p>
        )}

        {!loading && !error && isDomingo && (
          <section>
            <div className="flex overflow-x-auto scrollbar-hide overflow-y-visible gap-x-4 py-3 px-3 md:px-1 pb-6 md:pb-2 md:grid md:grid-cols-6 md:gap-y-4 rounded-2xl">
              {eventos.length === 0 ? (
                <p className="text-sm text-gray-400 col-span-6">
                  Nenhum evento agendado para este domingo.
                </p>
              ) : (
                eventos.map((ev) => (
                  <CardEvento key={ev.id} evento={ev} onClick={handleCardClick} />
                ))
              )}
            </div>
          </section>
        )}
      </div>

      <ModalDetalhesEvento
        evento={eventoSelecionado}
        isOpen={detalhesModal.isOpen}
        onOpenChange={detalhesModal.onOpenChange}
        onCancelSuccess={onRefetch}
      />
    </div>
  );
}
import { useState, useMemo } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Input,
  Select,
  SelectItem,
  Calendar,
} from "@heroui/react";
import { CalendarDate, today, getLocalTimeZone, type DateValue } from "@internationalized/date";
import { useQuadras } from "../../../hooks/agendamentos/useQuadras";
import { ModalConfirmarEvento, type DadosConfirmacaoEvento } from "./ModalConfirmarEvento";

interface Props {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

// Preços fixos
const PRECO_QUADRA = 250;
const PRECO_SAUNA_PISCINA = 100;
const PRECO_ESPACO_INTEIRO = 700;

function aplicarMascaraTelefone(valor: string): string {
  const nums = valor.replace(/\D/g, "").slice(0, 11);
  if (nums.length <= 2) return `(${nums}`;
  if (nums.length <= 7) return `(${nums.slice(0, 2)}) ${nums.slice(2)}`;
  return `(${nums.slice(0, 2)}) ${nums.slice(2, 7)}-${nums.slice(7)}`;
}

// Só permite selecionar domingos
function isDomingo(date: DateValue): boolean {
  return new CalendarDate(date.year, date.month, date.day)
    .toDate(getLocalTimeZone())
    .getDay() === 0;
}

const inputClass = {
  innerWrapper: "flex items-center gap-2 bg-lightblue py-3 px-4 rounded-xl",
  input: "text-sm focus:outline-none border-transparent focus:border-transparent focus:ring-0",
  inputWrapper: "p-0",
};

const selectClass = {
  trigger: "bg-lightblue rounded-xl px-4 h-12 shadow-none border-none data-[hover=true]:bg-lightblue/80",
  value: "text-sm",
  popoverContent: "rounded-xl shadow-lg border border-gray-100",
};

export function ModalNovoEvento({ isOpen, onOpenChange, onSuccess }: Props) {
  const [fullname, setFullname] = useState("");
  const [telefone, setTelefone] = useState("");
  const [tipoReserva, setTipoReserva] = useState<"single_court" | "full_venue" | null>(null);
  const [quadraId, setQuadraId] = useState<string | null>(null);
  const [includeSaunaPool, setIncludeSaunaPool] = useState(false);
  const [dataSelecionada, setDataSelecionada] = useState<CalendarDate | null>(null);
  const [horarioInicio, setHorarioInicio] = useState("");
  const [horarioFim, setHorarioFim] = useState("");

  const [confirmacaoAberta, setConfirmacaoAberta] = useState(false);
  const [dadosConfirmacao, setDadosConfirmacao] = useState<DadosConfirmacaoEvento | null>(null);

  const { quadras } = useQuadras();

  const phoneNumeros = telefone.replace(/\D/g, "");
  const telefoneValido = phoneNumeros.length === 11 && phoneNumeros[2] === "9";

  const preco = useMemo(() => {
    if (tipoReserva === "full_venue") return PRECO_ESPACO_INTEIRO;
    if (tipoReserva === "single_court") {
      return PRECO_QUADRA + (includeSaunaPool ? PRECO_SAUNA_PISCINA : 0);
    }
    return 0;
  }, [tipoReserva, includeSaunaPool]);

  const podeSalvar =
    fullname.trim() &&
    telefoneValido &&
    tipoReserva !== null &&
    (tipoReserva === "full_venue" || quadraId !== null) &&
    dataSelecionada !== null &&
    horarioInicio !== "" &&
    horarioFim !== "";

  function resetar() {
    setFullname("");
    setTelefone("");
    setTipoReserva(null);
    setQuadraId(null);
    setIncludeSaunaPool(false);
    setDataSelecionada(null);
    setHorarioInicio("");
    setHorarioFim("");
  }

  function buildDatetimeLocal(date: CalendarDate, time: string): string {
    const jsDate = date.toDate(getLocalTimeZone());
    const ano = jsDate.getFullYear();
    const mes = String(jsDate.getMonth() + 1).padStart(2, "0");
    const dia = String(jsDate.getDate()).padStart(2, "0");
    return `${ano}-${mes}-${dia}T${time}:00`;
  }

  function getEventDate(date: CalendarDate): string {
    const jsDate = date.toDate(getLocalTimeZone());
    const ano = jsDate.getFullYear();
    const mes = String(jsDate.getMonth() + 1).padStart(2, "0");
    const dia = String(jsDate.getDate()).padStart(2, "0");
    return `${ano}-${mes}-${dia}`;
  }

  function handleAbrirConfirmacao(onClose: () => void) {
    if (!podeSalvar || !dataSelecionada) return;

    const quadraSelecionada = quadras.find((q) => q.id === quadraId) ?? null;

    setDadosConfirmacao({
      fullname,
      phone: phoneNumeros,
      telefoneFormatado: telefone,
      booking_type: tipoReserva!,
      court_id: quadraId,
      include_sauna_pool: includeSaunaPool,
      event_date: getEventDate(dataSelecionada),
      booking_start: buildDatetimeLocal(dataSelecionada, horarioInicio),
      booking_end: buildDatetimeLocal(dataSelecionada, horarioFim),
      price: preco,
      quadraNome: quadraSelecionada?.name ?? null,
      quadraImageUrl: quadraSelecionada?.image_url ?? null,
    });

    onClose();
    setConfirmacaoAberta(true);
  }

  function handleVoltarParaFormulario() {
    setConfirmacaoAberta(false);
    onOpenChange(true);
  }

  function handleConfirmacaoSuccess() {
    setConfirmacaoAberta(false);
    resetar();
    onSuccess?.();
  }

  const hoje = today(getLocalTimeZone());
  const maxDate = hoje.add({ days: 180 });

  const precoFormatado = preco.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

  return (
    <>
      <Modal
        isOpen={isOpen}
        onOpenChange={(open) => {
          if (!open) resetar();
          onOpenChange(open);
        }}
        placement="center"
        scrollBehavior="inside"
        classNames={{
          wrapper: "px-4 !overflow-hidden",
          closeButton: "text-white hover:bg-white/40 cursor-pointer p-1",
          base: "max-h-[90vh] my-auto",
        }}
        className="rounded-t-xl"
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex justify-center gradient-background text-white rounded-t-xl">
                Novo Evento
              </ModalHeader>

              <ModalBody className="flex flex-col gap-y-3 mt-3 overflow-y-auto">
                {/* Nome */}
                <Input
                  placeholder="Nome Completo"
                  aria-label="Nome Completo"
                  value={fullname}
                  onValueChange={setFullname}
                  classNames={inputClass}
                />

                {/* Telefone */}
                <Input
                  placeholder="(XX) 9XXXX-XXXX"
                  aria-label="Telefone"
                  value={telefone}
                  onValueChange={(v) => setTelefone(aplicarMascaraTelefone(v))}
                  isInvalid={telefone.length > 0 && !telefoneValido}
                  errorMessage="Telefone inválido"
                  classNames={inputClass}
                />

                {/* Tipo de reserva */}
                <Select
                  placeholder="Tipo de Reserva"
                  aria-label="Tipo de Reserva"
                  selectedKeys={tipoReserva ? new Set([tipoReserva]) : new Set()}
                  onSelectionChange={(keys) => {
                    const val = (Array.from(keys)[0] as "single_court" | "full_venue") ?? null;
                    setTipoReserva(val);
                    setQuadraId(null);
                    setIncludeSaunaPool(false);
                  }}
                  classNames={selectClass}
                >
                  <SelectItem key="single_court">Quadra Individual — R$ 250</SelectItem>
                  <SelectItem key="full_venue">Espaço Inteiro — R$ 700</SelectItem>
                </Select>

                {/* Quadra (só para single_court) */}
                {tipoReserva === "single_court" && (
                  <Select
                    placeholder="Selecionar Quadra"
                    aria-label="Quadra"
                    selectedKeys={quadraId ? new Set([quadraId]) : new Set()}
                    onSelectionChange={(keys) => {
                      const val = (Array.from(keys)[0] as string) ?? null;
                      setQuadraId(val);
                    }}
                    classNames={selectClass}
                  >
                    {quadras.map((q) => (
                      <SelectItem key={q.id}>{q.name}</SelectItem>
                    ))}
                  </Select>
                )}

                {/* Sauna + Piscina (só para single_court) */}
                {tipoReserva === "single_court" && (
                  <button
                    type="button"
                    onClick={() => setIncludeSaunaPool((v) => !v)}
                    className={`flex items-center justify-between px-4 py-3 rounded-xl text-sm transition-all cursor-pointer
                      ${includeSaunaPool
                        ? "bg-brand text-white"
                        : "bg-lightblue text-gray-700 hover:bg-lightblue/80"
                      }`}
                  >
                    <span>Incluir Sauna + Piscina</span>
                    <span className="font-semibold">+ R$ 100</span>
                  </button>
                )}

                {/* Preço calculado */}
                {tipoReserva && (
                  <div className="flex items-center justify-between bg-brand/10 rounded-xl px-4 py-3">
                    <span className="text-sm text-brand font-medium">Total</span>
                    <span className="text-sm font-bold text-brand">{precoFormatado}</span>
                  </div>
                )}

                {/* Data — apenas domingos */}
                {tipoReserva && (
                  <div className="flex flex-col gap-y-1">
                    <p className="text-xs text-gray-500 px-1">
                      Selecionar Data <span className="text-gray-400">(apenas domingos)</span>
                    </p>
                    <div className="flex justify-center bg-lightblue rounded-xl p-3">
                      <Calendar
                        aria-label="Data do evento"
                        value={dataSelecionada}
                        onChange={(d: DateValue) => setDataSelecionada(new CalendarDate(d.year, d.month, d.day))}
                        minValue={hoje}
                        maxValue={maxDate}
                        focusedValue={dataSelecionada ?? hoje}
                        onFocusChange={(d: DateValue) => { if (d) setDataSelecionada(new CalendarDate(d.year, d.month, d.day)); }}
                        isDateUnavailable={(date) => !isDomingo(date)}
                        classNames={{
                          cellButton: `data-[selected=true]:bg-brand data-[selected=true]:text-white`,
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* Horário de início e fim */}
                {dataSelecionada && (
                  <div className="flex flex-col gap-y-2">
                    <p className="text-xs text-gray-500 px-1">Horário do Evento</p>
                    <div className="flex gap-x-3">
                      <div className="flex-1 flex flex-col gap-y-1">
                        <label className="text-xs text-gray-400 px-1">Início</label>
                        <input
                          type="time"
                          value={horarioInicio}
                          onChange={(e) => setHorarioInicio(e.target.value)}
                          className="bg-lightblue rounded-xl px-4 py-3 text-sm focus:outline-none w-full"
                        />
                      </div>
                      <div className="flex-1 flex flex-col gap-y-1">
                        <label className="text-xs text-gray-400 px-1">Fim</label>
                        <input
                          type="time"
                          value={horarioFim}
                          onChange={(e) => setHorarioFim(e.target.value)}
                          className="bg-lightblue rounded-xl px-4 py-3 text-sm focus:outline-none w-full"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </ModalBody>

              <ModalFooter className="flex justify-center">
                <button onClick={onClose} className="cancel-button">
                  Cancelar
                </button>
                <button
                  className="confirm-button disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={!podeSalvar}
                  onClick={() => handleAbrirConfirmacao(onClose)}
                >
                  Salvar
                </button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      <ModalConfirmarEvento
        isOpen={confirmacaoAberta}
        onOpenChange={setConfirmacaoAberta}
        dados={dadosConfirmacao}
        onVoltar={handleVoltarParaFormulario}
        onSuccess={handleConfirmacaoSuccess}
      />
    </>
  );
}
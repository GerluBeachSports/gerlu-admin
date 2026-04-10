import { CalendarDate, getLocalTimeZone } from "@internationalized/date";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  CircleArrowLeft01Icon,
  CircleArrowRight01Icon,
} from "@hugeicons/core-free-icons";
import { useEventosMes } from "../../../hooks/eventos/useEventos";

interface Props {
  dataSelecionada: CalendarDate;
  setDataSelecionada: (data: CalendarDate) => void;
  setVisualizacao: (v: "mes" | "dia") => void;
}

interface DiaCalendario {
  dia: number;
  mes: "anterior" | "atual" | "proximo";
}

const DIAS_SEMANA_DESKTOP = [
  "Domingo",
  "Segunda-feira",
  "Terça-feira",
  "Quarta-feira",
  "Quinta-feira",
  "Sexta-feira",
  "Sábado",
];
const DIAS_SEMANA_MOBILE = ["D", "S", "T", "Q", "Q", "S", "S"];

const MESES = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

export function EventosMes({
  dataSelecionada,
  setDataSelecionada,
  setVisualizacao,
}: Props) {
  const jsDate = dataSelecionada.toDate(getLocalTimeZone());
  const mes = jsDate.getMonth();
  const ano = jsDate.getFullYear();

  const { resumo } = useEventosMes(dataSelecionada);

  const primeiroDiaMes = new Date(ano, mes, 1).getDay();
  const diasNoMes = new Date(ano, mes + 1, 0).getDate();
  const diasNoMesAnterior = new Date(ano, mes, 0).getDate();

  const diasCalendario: DiaCalendario[] = [];
  for (let i = primeiroDiaMes - 1; i >= 0; i--) {
    diasCalendario.push({ dia: diasNoMesAnterior - i, mes: "anterior" });
  }
  for (let i = 1; i <= diasNoMes; i++) {
    diasCalendario.push({ dia: i, mes: "atual" });
  }
  let diaProximo = 1;
  while (diasCalendario.length < 42) {
    diasCalendario.push({ dia: diaProximo++, mes: "proximo" });
  }

  function mesAnterior() {
    setDataSelecionada(dataSelecionada.subtract({ months: 1 }));
  }
  function proximoMes() {
    setDataSelecionada(dataSelecionada.add({ months: 1 }));
  }
  function irParaDia(dia: number) {
    setDataSelecionada(new CalendarDate(ano, mes + 1, dia));
    setVisualizacao("dia");
  }

  const diasComEventos = Object.keys(resumo).map(Number).sort((a, b) => a - b);

  return (
    <div className="bg-white rounded-2xl shadow p-6">
      <div className="flex items-center justify-center gap-4 mb-6">
        <button onClick={mesAnterior} className="cursor-pointer">
          <HugeiconsIcon icon={CircleArrowLeft01Icon} size={22} />
        </button>
        <h2 className="text-lg font-semibold">
          {MESES[mes]} {ano}
        </h2>
        <button onClick={proximoMes} className="cursor-pointer">
          <HugeiconsIcon icon={CircleArrowRight01Icon} size={22} />
        </button>
      </div>

      {/* ── DESKTOP ── */}
      <div className="hidden md:block">
        <div className="grid grid-cols-7 text-center text-sm mb-2">
          {DIAS_SEMANA_DESKTOP.map((dia) => (
            <div
              key={dia}
              className={`font-medium ${dia === "Domingo" ? "text-brand" : ""}`}
            >
              {dia}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 grid-rows-6 border rounded-xl overflow-hidden">
          {diasCalendario.map((item, index) => {
            const evento = item.mes === "atual" ? resumo[item.dia] : null;
            const isDomingo = new Date(ano, mes, item.dia).getDay() === 0;

            return (
              <div
                key={index}
                className={`border h-28 p-2 flex flex-col
                  ${item.mes !== "atual" ? "bg-gray-100" : ""}
                  ${isDomingo && item.mes === "atual" ? "bg-brand/5" : ""}
                `}
              >
                <span
                  className={`text-sm mb-2 ${
                    item.mes !== "atual"
                      ? "text-gray-400"
                      : isDomingo
                      ? "text-brand font-semibold"
                      : "text-gray-800"
                  }`}
                >
                  {String(item.dia).padStart(2, "0")}
                </span>

                {evento && (
                  <button
                    onClick={() => irParaDia(item.dia)}
                    className="mt-auto bg-brand text-white text-xs rounded-lg px-2 py-1 cursor-pointer hover:bg-brand/80 transition-colors"
                  >
                    {evento.quantidade} evento{evento.quantidade > 1 ? "s" : ""}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── MOBILE ── */}
      <div className="md:hidden">
        <div className="grid grid-cols-7 text-center text-xs mb-1">
          {DIAS_SEMANA_MOBILE.map((dia, i) => (
            <div
              key={i}
              className={`font-medium py-1 ${i === 0 ? "text-brand" : "text-gray-500"}`}
            >
              {dia}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 border rounded-xl overflow-hidden mb-6">
          {diasCalendario.map((item, index) => {
            const temEvento = item.mes === "atual" && !!resumo[item.dia];
            const isDomingo = new Date(ano, mes, item.dia).getDay() === 0;

            return (
              <button
                key={index}
                onClick={() => item.mes === "atual" && irParaDia(item.dia)}
                className={`border aspect-square flex flex-col items-center justify-center gap-0.5 p-1
                  ${item.mes !== "atual" ? "bg-gray-100" : isDomingo ? "bg-brand/5" : ""}
                  ${temEvento ? "cursor-pointer" : "cursor-default"}`}
              >
                <span
                  className={`text-xs font-medium leading-none ${
                    item.mes !== "atual"
                      ? "text-gray-300"
                      : isDomingo
                      ? "text-brand font-semibold"
                      : "text-gray-400"
                  }`}
                >
                  {String(item.dia).padStart(2, "0")}
                </span>
                {temEvento && (
                  <span className="w-1.5 h-1.5 rounded-full bg-brand mt-0.5" />
                )}
              </button>
            );
          })}
        </div>

        <div className="flex flex-col gap-3">
          {diasComEventos.map((dia) => {
            const ev = resumo[dia];
            const dataFormatada = new Date(ano, mes, dia).toLocaleDateString(
              "pt-BR",
              { weekday: "long", day: "2-digit", month: "long" }
            );

            return (
              <button
                key={dia}
                onClick={() => irParaDia(dia)}
                className="w-full text-left border rounded-xl p-3 hover:bg-gray-50 cursor-pointer"
              >
                <p className="text-sm font-semibold text-gray-700 capitalize mb-1">
                  {dataFormatada}
                </p>
                <p className="text-xs text-brand font-medium">
                  {ev.quantidade} evento{ev.quantidade > 1 ? "s" : ""}
                </p>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
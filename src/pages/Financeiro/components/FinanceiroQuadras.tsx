import { memo, useMemo, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { useFinanceiroQuadrasMes } from "../../../hooks/financeiro/useFinanceiroQuadras";
import { useFinanceiroQuadrasAnual } from "../../../hooks/financeiro/useFinanceiroQuadras";
import type { EsporteData, SemanaData, MesData, MesEsporteData } from "../../../hooks/financeiro/useFinanceiroQuadras";
import { HugeiconsIcon } from "@hugeicons/react";
import { CircleArrowLeft01Icon, CircleArrowRight01Icon } from "@hugeicons/core-free-icons";

// ── Tipos ─────────────────────────────────────────────────────────────────────
interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number; name?: string; color?: string }>;
  label?: string;
  prefix?: string;
  suffix?: string;
}

// ── Constantes ────────────────────────────────────────────────────────────────
const SPORT_COLORS: Record<string, string> = {
  "Beach Tennis": "#3B82F6",
  "Vôlei": "#EF4444",
  "Futvôlei": "#22C55E",
  "Peteca": "#8907AE",
  "Queimada": "#F600DD",
  "Funcional na areia": "#A19020",
};
const BRL = (v: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
const semanaLabels: Record<number, string> = { 1: "1-7", 2: "8-14", 3: "15-21", 4: "22-28", 5: "29-31" };
const MONTHS = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

// ── Componentes auxiliares ────────────────────────────────────────────────────
function CustomTooltip({ active, payload, label, prefix = "", suffix = "" }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-lg px-3 py-2 shadow-lg text-sm">
      <p className="text-gray-500 text-xs mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="font-bold" style={{ color: p.color ?? "#111" }}>
          {p.name ? `${p.name}: ` : ""}{prefix}{typeof p.value === "number" ? p.value.toLocaleString("pt-BR") : p.value}{suffix}
        </p>
      ))}
    </div>
  );
}

function DonutChart({ data, label }: { data: EsporteData[]; label: "faturamento" | "agendamentos" }) {
  const items = data.map(d => ({
    name: d.esporte,
    value: label === "faturamento" ? d.faturamento : d.agendamentos,
    color: SPORT_COLORS[d.esporte] ?? "#ccc",
  }));
  const total = items.reduce((s, d) => s + d.value, 0);
  const r = 44, cx = 56, cy = 56, stroke = 14;
  const circ = 2 * Math.PI * r;
  let offset = 0;
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col items-center">
      <p className="text-xs font-medium text-gray-400 text-center mb-1">Esportes</p>
      <p className="text-[10px] text-gray-400 text-center mb-3 capitalize">{label}</p>
      <svg width="112" height="112" viewBox="0 0 112 112">
        {items.map((seg, i) => {
          const dash = total > 0 ? (seg.value / total) * circ : 0;
          const gap = circ - dash;
          const el = (
            <circle key={i} cx={cx} cy={cy} r={r}
              fill="none" stroke={seg.color} strokeWidth={stroke}
              strokeDasharray={`${dash} ${gap}`} strokeDashoffset={-offset}
              transform={`rotate(-90 ${cx} ${cy})`}
              style={{ transition: "stroke-dasharray 0.6s ease" }}
            />
          );
          offset += dash;
          return el;
        })}
        <circle cx={cx} cy={cy} r={r - stroke / 2 - 2} fill="white" />
      </svg>
      <div className="flex flex-col gap-1 w-full mt-3">
        {items.map((d, i) => (
          <div key={i} className="flex items-center gap-2 text-xs text-gray-500">
            <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: d.color }} />
            <span>{d.name}</span>
            <span className="ml-auto font-semibold text-gray-700">
              {label === "faturamento" ? BRL(d.value) : d.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Seção Mensal ─────────────────────────────────────────────────────────────
function SecaoMensal({ monthIdx, year }: { monthIdx: number; year: number }) {
  const { kpis, porEsporte, porSemana, loading, error } = useFinanceiroQuadrasMes(monthIdx, year);

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-400 text-sm">Carregando...</div>;
  if (error) return <div className="flex items-center justify-center h-64 text-red-400 text-sm">{error}</div>;

  return (
    <>
      <div className="grid grid-cols-4 gap-5 mb-5">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <p className="text-xs font-medium text-gray-400 mb-3">Faturamento</p>
          <p className="text-2xl font-extrabold text-gray-900 mb-2">{BRL(kpis?.faturamento ?? 0)}</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <p className="text-xs font-medium text-gray-400 mb-3">Agendamentos</p>
          <p className="text-2xl font-extrabold text-gray-900 mb-2">{kpis?.agendamentos ?? 0}</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <p className="text-xs font-medium text-gray-400 mb-3">Quadra mais alugada</p>
          <p className="text-2xl font-extrabold text-gray-900">{kpis?.quadraMaisAlugada ?? "—"}</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <p className="text-xs font-medium text-gray-400 mb-3">Clientes</p>
          <p className="text-2xl font-extrabold text-gray-900 mb-2">{kpis?.clientes ?? 0}</p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-5 mb-8">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 col-span-2">
          <p className="text-xs font-medium text-gray-400 text-center mb-3">Agendamentos por Semana</p>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={porSemana.map((s: SemanaData) => ({ semana: semanaLabels[s.semana] ?? `Sem ${s.semana}`, agendamentos: s.agendamentos }))} barSize={24}>
              <XAxis dataKey="semana" tick={{ fontSize: 9, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 9, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip suffix="" />} />
              <Bar dataKey="agendamentos" radius={[4, 4, 0, 0]}>
                {porSemana.map((_, i) => <Cell key={i} fill="#2563eb" />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <DonutChart data={porEsporte} label="faturamento" />
        <DonutChart data={porEsporte} label="agendamentos" />
      </div>
    </>
  );
}

// ── Seção Anual ──────────────────────────────────────────────────────────────
const SecaoAnual = memo(function SecaoAnual({ displayYear }: { displayYear: number }) {
  const { anual, anualPorEsporte } = useFinanceiroQuadrasAnual(displayYear);

  const semDados = anual.length === 0 && anualPorEsporte.length === 0;

  const stackedData = useMemo(() => {
    const map: Record<string, Record<string, number | string>> = {};
    anualPorEsporte.forEach(({ mes, esporte, agendamentos }: MesEsporteData) => {
      if (!map[mes]) map[mes] = { mes };
      map[mes][esporte] = agendamentos;
    });
    return Object.values(map);
  }, [anualPorEsporte]);

  const sportKeys = useMemo(() =>
    [...new Set(anualPorEsporte.map((d: MesEsporteData) => d.esporte))],
    [anualPorEsporte]
  );

  const Vazio = () => (
    <div className="flex items-center justify-center h-[200px] text-gray-300 text-sm">
      Sem informações para esta data
    </div>
  );

  return (
    <div className="grid grid-cols-3 gap-5">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <p className="text-sm font-semibold text-gray-700 text-center mb-5">Agendamentos de esportes por mês</p>
        {semDados ? <Vazio /> : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={stackedData} barSize={20}>
              <XAxis dataKey="mes" tick={{ fontSize: 9, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 9, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 8, fontSize: 11 }} />
              {sportKeys.map((key, i) => (
                <Bar key={key} dataKey={key} stackId="a"
                  fill={SPORT_COLORS[key] ?? "#ccc"}
                  radius={i === sportKeys.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        )}
        <div className="flex flex-wrap gap-x-3 gap-y-1 mt-3 justify-center">
          {sportKeys.map(k => (
            <div key={k} className="flex items-center gap-1.5 text-[10px] text-gray-500">
              <div className="w-2.5 h-2.5 rounded-sm" style={{ background: SPORT_COLORS[k] ?? "#ccc" }} />
              {k}
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <p className="text-sm font-semibold text-gray-700 text-center mb-5">Faturamento por mês</p>
        {semDados ? <Vazio /> : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={anual} barSize={24}>
              <XAxis dataKey="mes" tick={{ fontSize: 9, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 9, fill: "#9ca3af" }} axisLine={false} tickLine={false}
                tickFormatter={(v: number) => `R$${(v / 1000).toFixed(0)}k`} />
              <Tooltip content={<CustomTooltip prefix="R$ " />} />
              <Bar dataKey="faturamento" radius={[5, 5, 0, 0]}>
                {(anual as MesData[]).map((_, i) => <Cell key={i} fill={i === anual.length - 1 ? "#1d4ed8" : "#2563eb"} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <p className="text-sm font-semibold text-gray-700 text-center mb-5">Agendamentos por mês</p>
        {semDados ? <Vazio /> : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={anual} barSize={24}>
              <XAxis dataKey="mes" tick={{ fontSize: 9, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 9, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip suffix="" />} />
              <Bar dataKey="agendamentos" radius={[5, 5, 0, 0]}>
                {(anual as MesData[]).map((_, i) => <Cell key={i} fill={i === anual.length - 1 ? "#1d4ed8" : "#2563eb"} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
});
// ── Main ──────────────────────────────────────────────────────────────────────
export function FinanceiroQuadras() {
  const now = new Date();
  const [monthIdx, setMonthIdx] = useState(now.getMonth());
  const [year, setYear] = useState(now.getFullYear());
  const [displayYear, setDisplayYear] = useState(now.getFullYear());

  const prevMonth = () => {
    if (monthIdx === 0) { setMonthIdx(11); setYear(y => y - 1); }
    else setMonthIdx(m => m - 1);
  };
  const nextMonth = () => {
    if (monthIdx === 11) { setMonthIdx(0); setYear(y => y + 1); }
    else setMonthIdx(m => m + 1);
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-4">
      <div className="flex flex-col items-center gap-3 mb-6">
              <div className="flex items-center gap-4">
                <button onClick={prevMonth} className="cursor-pointer text-brand">
                  <HugeiconsIcon icon={CircleArrowLeft01Icon} size={22} />
                </button>
                <h2 className="text-xl font-bold text-brand w-48 text-center">
                  {MONTHS[monthIdx]} / {year}
                </h2>
                <button onClick={nextMonth} className="cursor-pointer text-brand">
                  <HugeiconsIcon icon={CircleArrowRight01Icon} size={22} />
                </button>
              </div>
              <SecaoMensal monthIdx={monthIdx} year={year} />
      
              <div className="flex items-center gap-4 text-sm">
                <button onClick={() => setDisplayYear(y => y - 1)} className="cursor-pointer text-brand">
                  <HugeiconsIcon icon={CircleArrowLeft01Icon} size={22} />
                </button>
                <span className="text-xl font-bold w-16 text-center text-brand">{displayYear}</span>
                <button onClick={() => setDisplayYear(y => y + 1)} className="cursor-pointer text-brand">
                  <HugeiconsIcon icon={CircleArrowRight01Icon} size={22} />
                </button>
              </div>
            </div>
      <SecaoAnual displayYear={displayYear} />
    </div>
  );
}
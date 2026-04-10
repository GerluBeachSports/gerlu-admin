import { memo, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { useFinanceiroAcademiaMes } from "../../../hooks/financeiro/useFinanceiroAcademia";
import { useFinanceiroAcademiaAnual } from "../../../hooks/financeiro/useFinanceiroAcademia";
import type { SemanaData, MesData, MesAlunosData } from "../../../hooks/financeiro/useFinanceiroAcademia";
import { HugeiconsIcon } from "@hugeicons/react";
import { CircleArrowLeft01Icon, CircleArrowRight01Icon } from "@hugeicons/core-free-icons";

// ── Tipos ─────────────────────────────────────────────────────────────────────
export interface FinanceiroAcademiaProps {
  monthIdx: number;
  year: number;
  displayYear: number;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number; name?: string; color?: string }>;
  label?: string;
  prefix?: string;
  suffix?: string;
}

// ── Constantes ────────────────────────────────────────────────────────────────
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
          {prefix}{typeof p.value === "number" ? p.value.toLocaleString("pt-BR") : p.value}{suffix}
        </p>
      ))}
    </div>
  );
}

function DonutStatusAlunos({ ativos, expirados, inativos }: { ativos: number; expirados: number; inativos: number }) {
  const data = [
    { label: "Alunos Ativos", value: ativos, color: "#4ade80" },
    { label: "Alunos Expirados", value: expirados, color: "#f97316" },
    { label: "Alunos Inativos", value: inativos, color: "#eab308" },
  ];
  const total = data.reduce((s, d) => s + d.value, 0);
  const r = 44, cx = 56, cy = 56, stroke = 14;
  const circ = 2 * Math.PI * r;
  let offset = 0;
  return (
    <div className="flex flex-col items-center gap-3">
      <svg width="112" height="112" viewBox="0 0 112 112">
        {data.map((seg, i) => {
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
      <div className="flex flex-wrap justify-center gap-x-4 gap-y-1">
        {data.map((d, i) => (
          <div key={i} className="flex items-center gap-1.5 text-xs text-gray-500">
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: d.color }} />
            {d.label} ({d.value})
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Seção Mensal ─────────────────────────────────────────────────────────────
function SecaoMensal({ monthIdx, year }: { monthIdx: number; year: number }) {
  const { kpis, statusAlunos, porSemana, loading, error } = useFinanceiroAcademiaMes(monthIdx, year);

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-400 text-sm">Carregando...</div>;
  if (error) return <div className="flex items-center justify-center h-64 text-red-400 text-sm">{error}</div>;

  return (
    <div className="grid grid-cols-4 gap-5 mb-8">
      {/* Coluna 1 */}
      <div className="flex flex-col gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <p className="text-xs font-medium text-gray-400 text-center mb-3">Faturamento</p>
          <p className="text-3xl font-extrabold text-gray-900 text-center">{BRL(kpis?.faturamento ?? 0)}</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 text-center">
          <p className="text-xs font-medium text-gray-400 mb-2">Alunos Ativos</p>
          <p className="text-4xl font-extrabold text-gray-900">{kpis?.alunosAtivos ?? 0}</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 text-center">
          <p className="text-xs font-medium text-gray-400 mb-2">Expirados ou Inativos</p>
          <p className="text-4xl font-extrabold text-gray-900">{kpis?.outrosAlunos ?? 0}</p>
        </div>
      </div>

      {/* Coluna 2 — Renovações por Semana */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col col-span-2">
        <p className="text-xs font-medium text-gray-400 text-center mb-4">Renovações por Semana</p>
        <div className="flex-1 min-h-0">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={porSemana.map((s: SemanaData) => ({
                semana: semanaLabels[s.semana] ?? `Sem ${s.semana}`,
                renovacoes: s.renovacoes,
              }))}
              barSize={36}
              margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
            >
              <XAxis dataKey="semana" tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 9, fill: "#9ca3af" }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip content={<CustomTooltip suffix=" renovações" />} cursor={{ fill: "#f3f4f6" }} />
              <Bar dataKey="renovacoes" radius={[6, 6, 0, 0]}>
                {porSemana.map((_entry, i) => (
                  <Cell key={i}
                    fill={i === porSemana.length - 1 ? "#1d4ed8" : "#2563eb"}
                    opacity={i === porSemana.length - 1 ? 1 : 0.75}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Coluna 3 — Status dos Alunos */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col items-center justify-center">
        <p className="text-xs font-medium text-gray-400 text-center mb-3">Status dos Alunos</p>
        <DonutStatusAlunos
          ativos={statusAlunos?.ativos ?? 0}
          expirados={statusAlunos?.expirados ?? 0}
          inativos={statusAlunos?.inativos ?? 0}
        />
      </div>
    </div>
  );
}

// ── Seção Anual ──────────────────────────────────────────────────────────────
const SecaoAnual = memo(function SecaoAnual({ displayYear }: { displayYear: number }) {
  const { anual, alunosPorMes } = useFinanceiroAcademiaAnual(displayYear);

  return (
    <div className="grid grid-cols-2 gap-5">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <p className="text-sm font-semibold text-gray-700 text-center mb-5">Faturamento por mês</p>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={anual} barSize={28}>
            <XAxis dataKey="mes" tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 9, fill: "#9ca3af" }} axisLine={false} tickLine={false}
              tickFormatter={(v: number) => `R$${(v / 1000).toFixed(0)}k`} />
            <Tooltip content={<CustomTooltip prefix="R$ " />} />
            <Bar dataKey="faturamento" radius={[5, 5, 0, 0]}>
              {(anual as MesData[]).map((_, i) => <Cell key={i} fill={i === anual.length - 1 ? "#1d4ed8" : "#2563eb"} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <p className="text-sm font-semibold text-gray-700 text-center mb-5">Alunos Ativos por Mês</p>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={alunosPorMes} barSize={28}>
            <XAxis dataKey="mes" tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 9, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip suffix=" alunos" />} />
            <Bar dataKey="alunos" radius={[5, 5, 0, 0]}>
              {(alunosPorMes as MesAlunosData[]).map((_, i) => <Cell key={i} fill={i === alunosPorMes.length - 1 ? "#1d4ed8" : "#2563eb"} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
});

// ── Main ──────────────────────────────────────────────────────────────────────
export function FinanceiroAcademia() {
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
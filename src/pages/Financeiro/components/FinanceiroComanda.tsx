import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from "recharts";
import { useFinanceiroComandasMes } from "../../../hooks/financeiro/useFinanceiroComanda";
import type { ComandasSemanaData } from "../../../hooks/financeiro/useFinanceiroComanda";
import { HugeiconsIcon } from "@hugeicons/react";
import { CircleArrowLeft01Icon, CircleArrowRight01Icon } from "@hugeicons/core-free-icons";

const BRL = (v: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
const semanaLabels: Record<number, string> = { 1: "1-7", 2: "8-14", 3: "15-21", 4: "22-28", 5: "29-31" };
const MONTHS = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
const BAR_COLORS = ["#2563eb", "#3b82f6", "#60a5fa", "#93c5fd", "#bfdbfe"];

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number; name?: string; color?: string }>;
  label?: string;
  prefix?: string;
}

function CustomTooltip({ active, payload, label, prefix = "" }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-lg px-3 py-2 shadow-lg text-sm">
      <p className="text-gray-500 text-xs mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="font-bold" style={{ color: p.color ?? "#111" }}>
          {p.name ? `${p.name}: ` : ""}{prefix}{typeof p.value === "number" ? p.value.toLocaleString("pt-BR") : p.value}
        </p>
      ))}
    </div>
  );
}

function KpiCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col gap-1">
      <p className="text-xs font-medium text-gray-400">{label}</p>
      <p className="text-2xl font-extrabold text-gray-900 truncate">{value}</p>
      {sub && <p className="text-xs text-gray-400">{sub}</p>}
    </div>
  );
}

function SecaoMensal({ monthIdx, year }: { monthIdx: number; year: number }) {
  const { kpis, porSemana, loading, error } = useFinanceiroComandasMes(monthIdx, year);

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-400 text-sm">Carregando...</div>;
  if (error) return <div className="flex items-center justify-center h-64 text-red-400 text-sm">{error}</div>;

  const semanaData = porSemana.map((s: ComandasSemanaData) => ({
    semana: semanaLabels[s.semana] ?? `Sem ${s.semana}`,
    faturamento: s.faturamento,
  }));

  // Dados simulados de distribuição para o donut (% por semana)
  const donutData = semanaData.map((s, i) => ({
    name: `Sem ${s.semana}`,
    value: s.faturamento,
    color: BAR_COLORS[i] ?? "#ccc",
  }));

  const totalSemanas = donutData.reduce((acc, d) => acc + d.value, 0);

  return (
    <div className="space-y-5 w-full">
      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-5">
        <KpiCard label="Faturamento Total" value={BRL(kpis?.faturamentoTotal ?? 0)} />
        <KpiCard label="Comandas Fechadas" value={String(kpis?.comandasFechadas ?? 0)} sub="no mês" />
        <KpiCard label="Ticket Médio" value={BRL(kpis?.ticketMedio ?? 0)} sub="por comanda" />
        <KpiCard label="Produto Mais Vendido" value={kpis?.produtoMaisVendido ?? "—"} />
      </div>

      {/* Gráficos principais */}
      <div className="grid grid-cols-3 gap-5">
        {/* Barras — ocupa 2 colunas */}
        <div className="col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <p className="text-sm font-semibold text-gray-700 mb-1">Faturamento por Semana</p>
          <p className="text-xs text-gray-400 mb-5">Distribuição semanal do mês</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={semanaData} barSize={40} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
              <XAxis dataKey="semana" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false}
                tickFormatter={(v: number) => `R$${(v / 1000).toFixed(1)}k`} />
              <Tooltip content={<CustomTooltip prefix="R$ " />} cursor={{ fill: "#f3f4f6" }} />
              <Bar dataKey="faturamento" radius={[8, 8, 0, 0]}>
                {semanaData.map((_, i) => (
                  <Cell key={i}
                    fill={i === semanaData.length - 1 ? "#1d4ed8" : "#2563eb"}
                    opacity={i === semanaData.length - 1 ? 1 : 0.7}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Donut — 1 coluna */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col items-center justify-center">
          <p className="text-sm font-semibold text-gray-700 mb-1 text-center">Participação</p>
          <p className="text-xs text-gray-400 mb-4 text-center">por semana</p>
          {totalSemanas > 0 ? (
            <>
              <PieChart width={140} height={140}>
                <Pie
                  data={donutData}
                  cx={65} cy={65}
                  innerRadius={42} outerRadius={65}
                  dataKey="value"
                  strokeWidth={0}
                >
                  {donutData.map((d, i) => (
                    <Cell key={i} fill={d.color} />
                  ))}
                </Pie>
              </PieChart>
              <div className="flex flex-col gap-1.5 w-full mt-3">
                {donutData.map((d, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-gray-500">
                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: d.color }} />
                    <span>{d.name}</span>
                    <span className="ml-auto font-semibold text-gray-700">
                      {totalSemanas > 0 ? `${((d.value / totalSemanas) * 100).toFixed(0)}%` : "—"}
                    </span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="text-xs text-gray-400">Sem dados</p>
          )}
        </div>
      </div>

      {/* Card de resumo textual */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <p className="text-sm font-semibold text-gray-700 mb-4">Resumo do Mês</p>
        <div className="grid grid-cols-3 gap-6 text-center">
          <div>
            <p className="text-xs text-gray-400 mb-1">Faturamento Total</p>
            <p className="text-xl font-extrabold text-gray-900">{BRL(kpis?.faturamentoTotal ?? 0)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-1">Receita Média Semanal</p>
            <p className="text-xl font-extrabold text-gray-900">
              {BRL(porSemana.length > 0 ? (kpis?.faturamentoTotal ?? 0) / porSemana.length : 0)}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-1">Semanas com Movimento</p>
            <p className="text-xl font-extrabold text-gray-900">{porSemana.length}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function FinanceiroComanda() {
  const now = new Date();
  const [monthIdx, setMonthIdx] = useState(now.getMonth());
  const [year, setYear] = useState(now.getFullYear());

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
      </div>
      <SecaoMensal monthIdx={monthIdx} year={year} />
    </div>
  );
}
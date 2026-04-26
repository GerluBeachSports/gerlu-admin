import { useState, useRef, useEffect } from "react";
import { FinanceiroQuadras } from "./components/FinanceiroQuadras";
import { FinanceiroGeral } from "./components/FinanceiroGeral";
import { FinanceiroComanda } from "./components/FinanceiroComanda";

type Filtro = "geral" | "comanda" | "quadras";

const opcoes: { value: Filtro; label: string }[] = [
  { value: "geral",    label: "Geral" },
  { value: "comanda", label: "comanda" },
  { value: "quadras",  label: "Quadras" },
];

export function FinanceiroPage() {
  const [filtro, setFiltro] = useState<Filtro>("geral");
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selecionado = opcoes.find(o => o.value === filtro)!;

  return (
    <main>
      {/* ── HEADER COM FILTRO ── */}
      <div className="flex justify-end px-6 pt-6 mb-2">
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setOpen(prev => !prev)}
            className="flex items-center gap-2 border border-red-500 text-red-500 hover:bg-red-50 text-sm font-semibold px-4 py-2.5 rounded-xl shadow-sm transition-colors"
          >
            <span>{selecionado.label}</span>
            <svg
              className={`w-4 h-4 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
              viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>

          {open && (
            <div className="absolute right-0 mt-2 w-44 bg-white border border-gray-100 rounded-xl shadow-lg z-50 overflow-hidden">
              {opcoes.map(opcao => (
                <button
                  key={opcao.value}
                  onClick={() => { setFiltro(opcao.value); setOpen(false); }}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors
                    ${filtro === opcao.value
                      ? "bg-green-50 text-green-800"
                      : "text-gray-600 hover:bg-gray-50"}`}
                >
                  <span>{opcao.label}</span>
                  {filtro === opcao.value && (
                    <svg className="w-4 h-4 ml-auto text-green-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── CONTEÚDO ── */}
      {filtro === "geral"    && <FinanceiroGeral />}
      {filtro === "comanda" && <FinanceiroComanda />}
      {filtro === "quadras"  && <FinanceiroQuadras />}
    </main>
  );
}
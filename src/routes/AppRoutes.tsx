import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import { LoginPage } from "../pages/Login/LoginPage";
import { AgendamentosPage } from "../pages/Agendamentos/AgendamentosPage";
import { FinanceiroPage } from "../pages/Financeiro/FinanceiroPage";
import { ConfiguracoesPage } from "../pages/Configuraçoes/ConfiguracoesPage";
import { GerenciarHorariosPage } from "../pages/GerenciarHorarios/GerenciarHorariosPage";
import { AgendamentosFixosPage } from "../pages/AgendamentosFixos/AgendamentosFixosPage";
import { ComandasPage } from "../pages/Comandas/ComandasPage";
import { ProdutosPage } from "../pages/Produtos/ProdutosPage";
import { MainLayout } from "../layouts/MainLayout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AuthRedirect } from "./components/AuthRedirect";

const AppRoutes = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<MainLayout />}>
            <Route path="/agendamentos" element={<AgendamentosPage />} />
            <Route path="/financeiro" element={<FinanceiroPage />} />
            <Route path="/comandas" element={<ComandasPage />} />
            <Route path="/produtos" element={<ProdutosPage />} />
            <Route path="/configuracoes" element={<ConfiguracoesPage />} />
            <Route path="/configuracoes/horarios" element={<GerenciarHorariosPage />} />
            <Route path="/configuracoes/agendamentos-fixos" element={<AgendamentosFixosPage />} />
          </Route>
        </Route>

        <Route element={<AuthRedirect />}>
          <Route path="/login" element={<LoginPage />} />
        </Route>

      </Routes>
    </BrowserRouter>
  );
};

export default AppRoutes;
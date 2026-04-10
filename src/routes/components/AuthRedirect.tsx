import { Navigate, Outlet } from 'react-router-dom';
import { useAdminSession } from '../../hooks/useAdminSession';

export function AuthRedirect() {
    const { isAuthenticated, isLoading } = useAdminSession();

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center flex-col gap-4">
                <div className="w-12 h-12 rounded-full border-3 border-gray-200 border-t-brand animate-spin" />
                <span className="text-sm text-gray-400 animate-pulse">Carregando...</span>
            </div>
        )
    }

    if (isAuthenticated) {
        return <Navigate to="/agendamentos" replace />;
    }

    return <Outlet />;
}
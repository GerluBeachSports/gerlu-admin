import LogoGerlu from "../../assets/logo-gerlu.svg"
import { Calendar03Icon, SaveMoneyDollarIcon, Settings01Icon, Menu01Icon, Cancel01Icon, ComputerDollarIcon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useNavigate } from "react-router-dom"
import { useState } from "react"

export function Navbar() {
    const navigate = useNavigate()
    const [menuOpen, setMenuOpen] = useState(false)

    const navItems = [
        { label: "Agendamentos", icon: Calendar03Icon, path: "/agendamentos" },
        { label: "Comandas", icon: ComputerDollarIcon, path: "/comandas" },
        { label: "Financeiro", icon: SaveMoneyDollarIcon, path: "/financeiro" },
        { label: "Configurações", icon: Settings01Icon, path: "/configuracoes" },
    ]

    const handleNavigate = (path: string) => {
        navigate(path)
        setMenuOpen(false)
    }

    return (
        <header className="w-full bg-brand text-white">
            <div className="flex flex-row items-center px-6 md:px-12 py-2 justify-between">
                <img src={LogoGerlu} alt="Logo Gerlu Beach Sports" className="h-16" />

                {/* Desktop nav */}
                <div className="hidden md:flex flex-row gap-8">
                    {navItems.map((item) => (
                        <button
                            key={item.path}
                            className="navbar-button"
                            onClick={() => handleNavigate(item.path)}
                        >
                            <HugeiconsIcon icon={item.icon} />
                            {item.label}
                        </button>
                    ))}
                </div>

                <button
                    className="md:hidden p-2 rounded-md hover:bg-white/10 transition-colors"
                    onClick={() => setMenuOpen((prev) => !prev)}
                    aria-label={menuOpen ? "Fechar menu" : "Abrir menu"}
                >
                    <HugeiconsIcon icon={menuOpen ? Cancel01Icon : Menu01Icon} size={24} />
                </button>
            </div>

            {menuOpen && (
                <div className="md:hidden flex flex-col px-6 pb-4 gap-2 border-t border-white/20">
                    {navItems.map((item) => (
                        <button
                            key={item.path}
                            className="navbar-button justify-start w-full py-3"
                            onClick={() => handleNavigate(item.path)}
                        >
                            <HugeiconsIcon icon={item.icon} />
                            {item.label}
                        </button>
                    ))}
                </div>
            )}
        </header>
    )
}
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

const ROLE_LABEL = { client: 'Cliente', employee: 'Empleado', host: 'Host', admin: 'Admin' }

const ROLE_NAV = {
  client: [
    { to: '/panel/mis-citas', label: 'Mis citas' },
    { to: '/panel/mis-rewards', label: 'Mis rewards' },
  ],
  employee: [
    { to: '/panel/mi-agenda', label: 'Mi agenda' },
  ],
  host: [
    { to: '/panel/mi-agenda', label: 'Mi agenda' },
    { to: '/panel/equipo', label: 'Equipo' },
    { to: '/panel/equipo/nueva-cita', label: 'Nueva cita (walk-in)' },
  ],
  admin: [
    { to: '/panel/transacciones', label: 'Transacciones' },
    { to: '/panel/usuarios', label: 'Usuarios' },
    { to: '/panel/equipo', label: 'Equipo' },
    { to: '/panel/equipo/nueva-cita', label: 'Nueva cita (walk-in)' },
  ],
}

const BASE = 'block rounded-md px-3 py-[0.6rem] text-[0.9rem] no-underline'
const INACTIVE = `${BASE} text-[#cfcfcf] hover:bg-[#2c2c2e] hover:text-white`
const ACTIVE = `${BASE} bg-[#c9a24b] font-semibold text-[#1c1c1e]`
const navClass = ({ isActive }) => (isActive ? ACTIVE : INACTIVE)

export function PanelLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const links = ROLE_NAV[user?.role] ?? []

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <aside className="hidden w-60 shrink-0 flex-col bg-[#1c1c1e] py-6 px-4 text-[#f5f5f5] md:flex">
        <div className="mb-1 px-2 text-[1.1rem] font-bold">Panel</div>
        <div className="mb-6 px-2 text-xs text-[#8e8e93]">
          {user?.name} · <span className="capitalize">{ROLE_LABEL[user?.role]}</span>
        </div>

        <nav className="flex flex-col gap-1 flex-1">
          {links.map(l => (
            <NavLink key={l.to} to={l.to} className={navClass} end={l.to === '/panel/equipo'}>
              {l.label}
            </NavLink>
          ))}
        </nav>

        <button
          onClick={handleLogout}
          className="mt-4 rounded-md px-3 py-[0.6rem] text-left text-[0.9rem] text-[#cfcfcf] hover:bg-[#2c2c2e] hover:text-white"
        >
          Cerrar sesión
        </button>
      </aside>

      {/* Mobile top bar */}
      <header className="flex items-center justify-between bg-[#1c1c1e] px-4 py-3 text-[#f5f5f5] md:hidden">
        <span className="font-semibold">Panel · {ROLE_LABEL[user?.role]}</span>
        <button onClick={handleLogout} className="text-sm text-[#cfcfcf]">Salir</button>
      </header>

      <main className="flex-1 overflow-x-auto p-4 md:p-8">
        <Outlet />
      </main>
    </div>
  )
}

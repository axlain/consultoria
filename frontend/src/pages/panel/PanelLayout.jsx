import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { ThemeToggleRow } from '../../components/ThemeToggle'
import { PanelMobileNav } from './PanelMobileNav'

const ROLE_LABEL = { employee: 'Empleado', host: 'Host', admin: 'Admin' }

const ROLE_NAV = {
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

const BASE = 'block rounded-xl px-3 py-2.5 text-sm no-underline transition-colors duration-150'
const INACTIVE = `${BASE} text-muted hover:bg-surface hover:text-ink`
const ACTIVE = `${BASE} bg-accent font-semibold text-[#0C0B09]`
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
    <div className="flex min-h-screen flex-col bg-paper md:flex-row">
      {/* Sidebar */}
      <aside className="hidden w-56 shrink-0 flex-col border-r border-line bg-surface-alt py-6 px-4 md:flex">
        <div className="mb-1 px-2 text-[1rem] font-bold text-ink">Panel</div>
        <div className="mb-6 px-2 text-xs text-muted">
          {user?.name} · <span className="capitalize">{ROLE_LABEL[user?.role]}</span>
        </div>

        <nav className="flex flex-col gap-1 flex-1">
          {links.map(l => (
            <NavLink key={l.to} to={l.to} className={navClass} end={l.to === '/panel/equipo'}>
              {l.label}
            </NavLink>
          ))}
        </nav>

        <ThemeToggleRow className={`${INACTIVE} mt-4`} />
        <button
          onClick={handleLogout}
          className="mt-1 rounded-xl px-3 py-2.5 text-left text-sm text-muted hover:bg-surface hover:text-red-400 transition-colors"
        >
          Cerrar sesión
        </button>
      </aside>

      <PanelMobileNav
        links={links}
        roleLabel={ROLE_LABEL[user?.role]}
        userName={user?.name}
        onLogout={handleLogout}
      />

      <main className="flex-1 overflow-x-auto p-4 md:p-8 text-ink">
        <Outlet />
      </main>
    </div>
  )
}

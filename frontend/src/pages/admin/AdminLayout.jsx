import { NavLink, Outlet } from 'react-router-dom'
import { useTenant } from '../../context/TenantContext'

function navClass({ isActive }) {
  return isActive ? 'admin-nav-link active' : 'admin-nav-link'
}

// Dark sidebar + top-level nav for the business-facing panel (RF06 and beyond).
export function AdminLayout() {
  const { tenant } = useTenant()

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-sidebar-brand">{tenant.business.name}</div>
        <nav>
          <NavLink to="agenda" className={navClass}>
            Agenda Completa
          </NavLink>
          <NavLink to="servicios" className={navClass}>
            Catálogo de Servicios
          </NavLink>
          <NavLink to="equipo" className={navClass}>
            Equipo / Barberos
          </NavLink>
        </nav>
      </aside>
      <main className="admin-main">
        <Outlet />
      </main>
    </div>
  )
}

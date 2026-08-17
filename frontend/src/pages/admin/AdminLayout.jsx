import { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { useTenant } from '../../context/TenantContext'
import { QrScannerModal } from './QrScannerModal'
import { AdminMobileNav } from './AdminMobileNav'

const NAV_LINK_BASE = 'block rounded-md px-3 py-[0.6rem] text-[0.9rem] no-underline'
const NAV_LINK_INACTIVE = `${NAV_LINK_BASE} text-[#cfcfcf] hover:bg-[#2c2c2e] hover:text-white`
const NAV_LINK_ACTIVE = `${NAV_LINK_BASE} bg-secondary font-semibold text-[#1c1c1e]`

function navClass({ isActive }) {
  return isActive ? NAV_LINK_ACTIVE : NAV_LINK_INACTIVE
}

// Dark sidebar + top-level nav for the business-facing panel (RF06 and beyond).
export function AdminLayout() {
  const { tenant } = useTenant()
  const [scannerOpen, setScannerOpen] = useState(false)

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <aside className="hidden w-60 shrink-0 bg-[#1c1c1e] py-6 px-4 text-[#f5f5f5] md:block">
        <div className="mb-8 px-2 text-[1.1rem] font-bold">{tenant.business.name}</div>
        <nav className="flex flex-col gap-1">
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

      <AdminMobileNav businessName={tenant.business.name} />

      <main className="max-w-[1400px] flex-1 overflow-x-auto p-4 md:p-8">
        <Outlet />
      </main>

      <button
        type="button"
        onClick={() => setScannerOpen(true)}
        className="bg-secondary fixed right-6 bottom-6 z-40 flex items-center gap-2 rounded-full px-5 py-4 text-sm font-semibold text-white shadow-[0_8px_24px_rgba(0,0,0,0.25)] transition-transform duration-150 hover:scale-[1.03] active:scale-[0.97]"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
          <circle cx="12" cy="13" r="4" />
        </svg>
        <span className="hidden sm:inline">Escanear QR</span>
      </button>

      {scannerOpen && <QrScannerModal tenantSlug={tenant.slug} onClose={() => setScannerOpen(false)} />}
    </div>
  )
}

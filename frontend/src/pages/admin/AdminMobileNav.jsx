import { useState } from 'react'
import { NavLink } from 'react-router-dom'

const NAV_LINK_BASE = 'block rounded-md px-3 py-[0.6rem] text-[0.9rem] no-underline'
const NAV_LINK_INACTIVE = `${NAV_LINK_BASE} text-[#cfcfcf] hover:bg-[#2c2c2e] hover:text-white`
const NAV_LINK_ACTIVE = `${NAV_LINK_BASE} bg-secondary font-semibold text-[#1c1c1e]`

function navClass({ isActive }) {
  return isActive ? NAV_LINK_ACTIVE : NAV_LINK_INACTIVE
}

// Mobile-only top bar + off-canvas drawer that stands in for the fixed dark sidebar
// (which stays put at md+), so admin content gets the phone's full width.
export function AdminMobileNav({ businessName }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="md:hidden">
      <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-[#2c2c2e] bg-[#1c1c1e] px-4 py-3 text-[#f5f5f5]">
        <button
          type="button"
          className="flex h-9 w-9 shrink-0 flex-col items-center justify-center gap-1 rounded-lg border border-[#3a3a3a]"
          aria-label="Abrir menú de navegación"
          aria-expanded={open}
          aria-controls="admin-nav-drawer"
          onClick={() => setOpen(true)}
        >
          <span className="h-0.5 w-[18px] rounded-[1px] bg-[#f5f5f5]" />
          <span className="h-0.5 w-[18px] rounded-[1px] bg-[#f5f5f5]" />
          <span className="h-0.5 w-[18px] rounded-[1px] bg-[#f5f5f5]" />
        </button>
        <span className="truncate font-semibold">{businessName}</span>
      </header>

      {open && (
        <div
          className="fixed inset-0 z-[100] flex bg-black/40 motion-safe:animate-fade-in"
          onClick={() => setOpen(false)}
        >
          <aside
            id="admin-nav-drawer"
            className="h-full w-[min(80vw,280px)] overflow-y-auto bg-[#1c1c1e] px-4 py-6 text-[#f5f5f5] shadow-[4px_0_16px_rgba(0,0,0,0.2)]"
            role="dialog"
            aria-label="Menú de navegación"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-8 flex items-center justify-between px-2">
              <span className="text-[1.1rem] font-bold">{businessName}</span>
              <button
                type="button"
                className="border-0 bg-transparent p-1 text-[1.5rem] leading-none text-[#f5f5f5]"
                aria-label="Cerrar menú"
                onClick={() => setOpen(false)}
              >
                ×
              </button>
            </div>
            <nav className="flex flex-col gap-1">
              <NavLink to="agenda" className={navClass} onClick={() => setOpen(false)}>
                Agenda Completa
              </NavLink>
              <NavLink to="servicios" className={navClass} onClick={() => setOpen(false)}>
                Catálogo de Servicios
              </NavLink>
              <NavLink to="equipo" className={navClass} onClick={() => setOpen(false)}>
                Equipo / Barberos
              </NavLink>
            </nav>
          </aside>
        </div>
      )}
    </div>
  )
}

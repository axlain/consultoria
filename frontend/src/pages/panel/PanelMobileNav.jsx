import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { ThemeToggleRow } from '../../components/ThemeToggle'

const NAV_LINK_BASE = 'block rounded-xl px-3 py-[0.6rem] text-[0.9rem] no-underline transition-colors'
const NAV_LINK_INACTIVE = `${NAV_LINK_BASE} text-muted hover:bg-line hover:text-ink`
const NAV_LINK_ACTIVE = `${NAV_LINK_BASE} bg-accent font-semibold text-[#0C0B09]`

function navClass({ isActive }) {
  return isActive ? NAV_LINK_ACTIVE : NAV_LINK_INACTIVE
}

// Mobile-only top bar + off-canvas drawer standing in for the fixed sidebar
// (hidden below md) — same pattern as admin/AdminMobileNav.jsx, adapted for
// the role-scoped /panel/* links instead of a fixed tenant-admin list.
export function PanelMobileNav({ links, roleLabel, userName, onLogout }) {
  const [open, setOpen] = useState(false)

  function closeDrawer() {
    setOpen(false)
  }

  return (
    <div className="md:hidden">
      <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-line bg-surface-alt px-4 py-3 text-ink">
        <button
          type="button"
          className="flex h-9 w-9 shrink-0 flex-col items-center justify-center gap-1 rounded-lg border border-line"
          aria-label="Abrir menú de navegación"
          aria-expanded={open}
          aria-controls="panel-nav-drawer"
          onClick={() => setOpen(true)}
        >
          <span className="h-0.5 w-[18px] rounded-[1px] bg-ink" />
          <span className="h-0.5 w-[18px] rounded-[1px] bg-ink" />
          <span className="h-0.5 w-[18px] rounded-[1px] bg-ink" />
        </button>
        <span className="truncate font-semibold text-sm">Panel · {roleLabel}</span>
      </header>

      {open && (
        <div
          className="fixed inset-0 z-[100] flex bg-black/40 motion-safe:animate-fade-in"
          onClick={closeDrawer}
        >
          <aside
            id="panel-nav-drawer"
            className="h-full w-[min(80vw,280px)] overflow-y-auto bg-surface-alt px-4 py-6 text-ink shadow-[4px_0_16px_rgba(0,0,0,0.4)] border-r border-line"
            role="dialog"
            aria-label="Menú de navegación"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-1 px-2 text-[1.1rem] font-bold">Panel</div>
            <div className="mb-6 px-2 text-xs text-muted">
              {userName} · <span className="capitalize">{roleLabel}</span>
            </div>

            <nav className="flex flex-col gap-1">
              {links.map((l) => (
                <NavLink
                  key={l.to}
                  to={l.to}
                  end={l.to === '/panel/equipo'}
                  className={navClass}
                  onClick={closeDrawer}
                >
                  {l.label}
                </NavLink>
              ))}
              <ThemeToggleRow className={NAV_LINK_INACTIVE} />
              <button
                type="button"
                onClick={() => {
                  closeDrawer()
                  onLogout()
                }}
                className="rounded-xl px-3 py-[0.6rem] text-left text-[0.9rem] text-muted hover:bg-line hover:text-red-400 transition-colors"
              >
                Cerrar sesión
              </button>
            </nav>
          </aside>
        </div>
      )}
    </div>
  )
}

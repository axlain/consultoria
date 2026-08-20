import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const LINK_CLASS =
  'block rounded-xl border border-[#2A2520] bg-[#1E1B15] px-3.5 py-2.5 text-sm font-medium text-white no-underline transition-colors hover:border-[#C8973E]/40'

export function AuthShell({ children, showMenu = true }) {
  const [open, setOpen] = useState(false)
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/', { replace: true })
    setOpen(false)
  }

  return (
    <div className="relative mx-auto min-h-screen min-w-[320px] max-w-[450px] bg-[#0C0B09] px-4 pt-8 pb-10 md:my-12 md:min-h-0 md:max-w-4xl md:rounded-3xl md:border md:border-[#2A2520] md:bg-[#161410] md:px-12 md:pt-12 md:pb-16 md:shadow-[0_24px_64px_rgba(0,0,0,0.6)]">
      {/* Top bar */}
      <div className="mb-8 flex items-center justify-between">
        <Link
          to="/"
          className="flex items-center gap-2 text-sm font-medium text-[#7A7065] no-underline hover:text-[#C8973E] transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
          Inicio
        </Link>

        {showMenu && (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="flex h-10 w-10 flex-col items-center justify-center gap-[5px] rounded-xl border border-[#2A2520] bg-[#1E1B15] transition-colors hover:border-[#C8973E]/40"
            aria-label="Abrir menú"
            aria-expanded={open}
          >
            <span className="h-0.5 w-[18px] rounded-sm bg-white" />
            <span className="h-0.5 w-[18px] rounded-sm bg-white" />
            <span className="h-0.5 w-[18px] rounded-sm bg-white" />
          </button>
        )}
      </div>

      {children}

      {showMenu && open && (
        <div
          className="fixed inset-0 z-[100] flex justify-end bg-black/60"
          onClick={() => setOpen(false)}
        >
          <aside
            className="h-full w-[min(85vw,340px)] overflow-y-auto bg-[#161410] border-l border-[#2A2520] p-6 shadow-[-4px_0_32px_rgba(0,0,0,0.8)]"
            role="dialog"
            aria-label="Menú de navegación"
            onClick={e => e.stopPropagation()}
          >
            <div className="mb-6 flex items-center justify-between">
              <span className="font-black text-white text-sm tracking-widest uppercase" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Menú</span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="border-0 bg-transparent p-1 text-[1.75rem] leading-none text-[#7A7065] hover:text-white"
                aria-label="Cerrar menú"
              >
                ×
              </button>
            </div>

            <nav className="mb-6">
              <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.14em] text-[#7A7065]">Navegación</p>
              <ul className="m-0 flex list-none flex-col gap-2 p-0">
                <li><Link to="/" onClick={() => setOpen(false)} className={LINK_CLASS}>Inicio</Link></li>
                <li><Link to="/demo/barberia" onClick={() => setOpen(false)} className={LINK_CLASS}>Barbería Demo</Link></li>
                <li><Link to="/demo/barberia/reservar" onClick={() => setOpen(false)} className={LINK_CLASS}>Agendar cita</Link></li>
              </ul>
            </nav>

            <nav className="mb-6">
              <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.14em] text-[#7A7065]">Cuenta</p>
              <ul className="m-0 flex list-none flex-col gap-2 p-0">
                {user ? (
                  <>
                    <li>
                      <Link to="/panel" onClick={() => setOpen(false)} className={LINK_CLASS}>Mi panel</Link>
                    </li>
                    <li>
                      <button
                        type="button"
                        onClick={handleLogout}
                        className={`${LINK_CLASS} w-full text-left text-[#ff6b6b] border-[#ff6b6b]/20 hover:border-[#ff6b6b]/40 hover:bg-[#ff6b6b]/5`}
                      >
                        Cerrar sesión
                      </button>
                    </li>
                  </>
                ) : (
                  <>
                    <li><Link to="/login" onClick={() => setOpen(false)} className={LINK_CLASS}>Iniciar sesión</Link></li>
                    <li><Link to="/registro" onClick={() => setOpen(false)} className={LINK_CLASS}>Crear cuenta</Link></li>
                  </>
                )}
              </ul>
            </nav>
          </aside>
        </div>
      )}
    </div>
  )
}

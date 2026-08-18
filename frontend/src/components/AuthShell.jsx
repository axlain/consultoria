import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const LINK_CLASS =
  'block rounded-lg border border-[#e5e5ea] bg-white px-3.5 py-2.5 text-sm font-medium text-[#1c1c1e] no-underline transition-colors hover:border-[#c9a24b] hover:bg-[#fdf8ef]'

export function AuthShell({ children }) {
  const [open, setOpen] = useState(false)
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/', { replace: true })
    setOpen(false)
  }

  return (
    <div className="relative mx-auto min-h-screen min-w-[320px] max-w-[450px] bg-white px-4 pt-8 pb-10 md:my-16 md:min-h-0 md:max-w-4xl md:rounded-2xl md:px-12 md:pt-12 md:pb-16 md:shadow-[0_8px_32px_rgba(0,0,0,0.06)]">
      {/* Top bar */}
      <div className="mb-8 flex items-center justify-between">
        <Link
          to="/"
          className="flex items-center gap-2 text-sm font-medium text-[#3a3a3c] no-underline hover:text-[#c9a24b]"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
          Inicio
        </Link>

        {/* Hamburger button */}
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex h-10 w-10 flex-col items-center justify-center gap-1 rounded-lg border border-[#e5e5ea] bg-white transition-colors hover:bg-[#f5f5f5]"
          aria-label="Abrir menú"
          aria-expanded={open}
        >
          <span className="h-0.5 w-[18px] rounded-sm bg-[#1c1c1e]" />
          <span className="h-0.5 w-[18px] rounded-sm bg-[#1c1c1e]" />
          <span className="h-0.5 w-[18px] rounded-sm bg-[#1c1c1e]" />
        </button>
      </div>

      {children}

      {/* Drawer */}
      {open && (
        <div
          className="fixed inset-0 z-[100] flex justify-end bg-black/40"
          onClick={() => setOpen(false)}
        >
          <aside
            className="h-full w-[min(85vw,340px)] overflow-y-auto bg-white p-6 shadow-[-4px_0_16px_rgba(0,0,0,0.2)]"
            role="dialog"
            aria-label="Menú de navegación"
            onClick={e => e.stopPropagation()}
          >
            <div className="mb-6 flex items-center justify-between">
              <h2 className="m-0 p-0 text-lg font-bold text-[#1c1c1e]">Menú</h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="border-0 bg-transparent p-1 text-[1.75rem] leading-none text-[#1c1c1e]"
                aria-label="Cerrar menú"
              >
                ×
              </button>
            </div>

            <nav className="mb-6">
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#8e8e93]">Navegación</p>
              <ul className="m-0 flex list-none flex-col gap-2 p-0">
                <li><Link to="/" onClick={() => setOpen(false)} className={LINK_CLASS}>Inicio</Link></li>
              </ul>
            </nav>

            <nav className="mb-6">
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#8e8e93]">Cuenta</p>
              <ul className="m-0 flex list-none flex-col gap-2 p-0">
                {user ? (
                  <>
                    <li>
                      <Link to="/panel" onClick={() => setOpen(false)} className={LINK_CLASS}>
                        Mi panel
                      </Link>
                    </li>
                    <li>
                      <button
                        type="button"
                        onClick={handleLogout}
                        className={`${LINK_CLASS} w-full text-left text-red-600 hover:border-red-300 hover:bg-red-50`}
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

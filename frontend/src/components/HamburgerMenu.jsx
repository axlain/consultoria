import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { roleHome } from './ProtectedRoute'

const NAV_LINK_CLASS =
  'block rounded-xl border border-[#2A2520] bg-[#1E1B15] px-3.5 py-2.5 text-sm font-medium text-[#F2EBE0] no-underline transition-colors hover:border-[#C8973E]/40 hover:bg-[#2A2520]'

export function HamburgerMenu({ faqs, slug }) {
  const [open, setOpen] = useState(false)
  const [faqOpen, setFaqOpen] = useState(false)
  const [openQuestion, setOpenQuestion] = useState(null)
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  function closeDrawer() { setOpen(false) }

  function handleLogout() {
    logout()
    closeDrawer()
    navigate('/', { replace: true })
  }

  return (
    <>
      <button
        type="button"
        className="absolute top-5 right-4 z-20 flex h-10 w-10 flex-col items-center justify-center gap-[5px] rounded-xl border border-[#2A2520] bg-[#1E1B15]/80 backdrop-blur-sm transition-colors hover:border-[#C8973E]/40"
        aria-label="Abrir menú"
        aria-expanded={open}
        aria-controls="site-drawer"
        onClick={() => setOpen(true)}
      >
        <span className="h-0.5 w-[18px] rounded-sm bg-[#F2EBE0]" />
        <span className="h-0.5 w-[18px] rounded-sm bg-[#F2EBE0]" />
        <span className="h-0.5 w-[18px] rounded-sm bg-[#F2EBE0]" />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[100] flex justify-end bg-black/60 motion-safe:animate-fade-in"
          onClick={closeDrawer}
        >
          <aside
            id="site-drawer"
            className="h-full w-[min(85vw,340px)] overflow-y-auto bg-[#0C0B09] p-6 shadow-[-4px_0_32px_rgba(0,0,0,0.8)] border-l border-[#2A2520]"
            role="dialog"
            aria-label="Menú de navegación"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-6 flex items-center justify-between">
              <span className="font-bold text-[#F2EBE0] text-sm">Menú</span>
              <button
                type="button"
                className="border-0 bg-transparent p-1 text-[1.75rem] leading-none text-[#7A7065] hover:text-[#F2EBE0]"
                aria-label="Cerrar menú"
                onClick={closeDrawer}
              >×</button>
            </div>

            <nav aria-label="Reservas" className="mb-6">
              <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.14em] text-[#7A7065]">Reservas</p>
              <ul className="m-0 flex list-none flex-col gap-2 p-0">
                <li><Link to={`/demo/${slug}`} onClick={closeDrawer} className={NAV_LINK_CLASS}>Inicio</Link></li>
                <li><Link to={`/demo/${slug}/reservar`} onClick={closeDrawer} className={NAV_LINK_CLASS}>Agendar cita</Link></li>
                <li><Link to={`/demo/${slug}/disponibilidad`} onClick={closeDrawer} className={NAV_LINK_CLASS}>Ver disponibilidad</Link></li>
              </ul>
            </nav>

            <nav aria-label="Cuenta" className="mb-6">
              <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.14em] text-[#7A7065]">Cuenta</p>
              <ul className="m-0 flex list-none flex-col gap-2 p-0">
                {!user && (
                  <li><Link to="/login" onClick={closeDrawer} className={NAV_LINK_CLASS}>Iniciar sesión / Mi Panel</Link></li>
                )}
                {user?.role === 'client' && (
                  <>
                    <li><Link to="/panel/mis-citas" onClick={closeDrawer} className={NAV_LINK_CLASS}>Mis citas</Link></li>
                    <li><Link to="/panel/mis-rewards" onClick={closeDrawer} className={NAV_LINK_CLASS}>Mis rewards</Link></li>
                  </>
                )}
                {user && user.role !== 'client' && (
                  <li><Link to={roleHome(user.role)} onClick={closeDrawer} className={NAV_LINK_CLASS}>Mi panel</Link></li>
                )}
                {user && (
                  <li>
                    <button type="button" onClick={handleLogout}
                      className={`${NAV_LINK_CLASS} w-full text-left text-red-400 border-red-500/20 hover:border-red-500/40`}>
                      Cerrar sesión
                    </button>
                  </li>
                )}
              </ul>
            </nav>

            <nav aria-label="Ayuda">
              <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.14em] text-[#7A7065]">Ayuda e información</p>
              <ul className="m-0 flex list-none flex-col gap-2 p-0">
                <li>
                  <button
                    type="button"
                    aria-expanded={faqOpen}
                    aria-controls="faq-accordion"
                    className={`${NAV_LINK_CLASS} flex w-full items-center justify-between`}
                    onClick={() => setFaqOpen((v) => !v)}
                  >
                    Preguntas frecuentes
                    <span className={`transition-transform duration-150 text-[#7A7065] ${faqOpen ? 'rotate-180' : ''}`}>▾</span>
                  </button>
                  {faqOpen && (
                    <dl id="faq-accordion" className="mt-2 mb-0 ml-1">
                      {faqs.map((faq) => {
                        const isOpen = openQuestion === faq.question
                        return (
                          <div key={faq.question} className="border-b border-[#2A2520] py-2 last:border-none">
                            <dt>
                              <button
                                type="button"
                                aria-expanded={isOpen}
                                className="flex w-full items-center justify-between border-0 bg-transparent p-0 text-left text-sm font-semibold text-[#F2EBE0]"
                                onClick={() => setOpenQuestion(isOpen ? null : faq.question)}
                              >
                                {faq.question}
                                <span className={`ml-2 shrink-0 transition-transform duration-150 text-[#7A7065] ${isOpen ? 'rotate-180' : ''}`}>▾</span>
                              </button>
                            </dt>
                            {isOpen && <dd className="m-0 mt-1.5 text-sm text-[#7A7065]">{faq.answer}</dd>}
                          </div>
                        )
                      })}
                    </dl>
                  )}
                </li>
                <li>
                  <Link to={`/demo/${slug}#map-heading`} onClick={closeDrawer} className={NAV_LINK_CLASS}>
                    Ubicación / Contacto
                  </Link>
                </li>
              </ul>
            </nav>
          </aside>
        </div>
      )}
    </>
  )
}

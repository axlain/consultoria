import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { roleHome } from './ProtectedRoute'

const SECTION_LABEL_CLASS = 'text-muted mb-2 text-xs font-semibold tracking-[0.12em] uppercase'
const NAV_LINK_CLASS =
  'border-line hover:border-secondary hover:bg-[var(--color-paper)] block rounded-lg border bg-white px-3.5 py-2.5 text-sm font-medium text-inherit no-underline transition-colors'

// RF07: general site navigation behind a hamburger toggle, grouped into sections
// (Reservas / Ayuda e información) instead of a single flat list — the FAQs live
// inside their own accordion so they don't compete with the nav actions above them.
export function HamburgerMenu({ faqs, slug }) {
  const [open, setOpen] = useState(false)
  const [faqOpen, setFaqOpen] = useState(false)
  const [openQuestion, setOpenQuestion] = useState(null)
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  function closeDrawer() {
    setOpen(false)
  }

  function handleLogout() {
    logout()
    closeDrawer()
    navigate('/', { replace: true })
  }

  return (
    <>
      <button
        type="button"
        className="border-line absolute top-5 right-4 z-20 flex h-10 w-10 flex-col items-center justify-center gap-1 rounded-lg border bg-white transition-colors hover:bg-[var(--color-paper)]"
        aria-label="Abrir menú"
        aria-expanded={open}
        aria-controls="site-drawer"
        onClick={() => setOpen(true)}
      >
        <span className="bg-primary h-0.5 w-[18px] rounded-[1px]" />
        <span className="bg-primary h-0.5 w-[18px] rounded-[1px]" />
        <span className="bg-primary h-0.5 w-[18px] rounded-[1px]" />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[100] flex justify-end bg-black/40 motion-safe:animate-fade-in"
          onClick={closeDrawer}
        >
          <aside
            id="site-drawer"
            className="h-full w-[min(85vw,340px)] overflow-y-auto bg-white p-6 shadow-[-4px_0_16px_rgba(0,0,0,0.2)]"
            role="dialog"
            aria-label="Menú de navegación"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-6 flex items-center justify-between">
              <h2 className="m-0 border-0 p-0">Menú</h2>
              <button
                type="button"
                className="text-primary border-0 bg-transparent p-1 text-[1.75rem] leading-none"
                aria-label="Cerrar menú"
                onClick={closeDrawer}
              >
                ×
              </button>
            </div>

            <nav aria-label="Reservas" className="mb-6">
              <p className={SECTION_LABEL_CLASS}>Reservas</p>
              <ul className="m-0 flex list-none flex-col gap-2 p-0">
                <li>
                  <Link to={`/demo/${slug}`} onClick={closeDrawer} className={NAV_LINK_CLASS}>
                    Inicio
                  </Link>
                </li>
                <li>
                  <Link to={`/demo/${slug}/reservar`} onClick={closeDrawer} className={NAV_LINK_CLASS}>
                    Agendar cita
                  </Link>
                </li>
                <li>
                  <Link to={`/demo/${slug}/disponibilidad`} onClick={closeDrawer} className={NAV_LINK_CLASS}>
                    Ver disponibilidad
                  </Link>
                </li>
              </ul>
            </nav>

            <nav aria-label="Cuenta" className="mb-6">
              <p className={SECTION_LABEL_CLASS}>Cuenta</p>
              <ul className="m-0 flex list-none flex-col gap-2 p-0">
                {!user && (
                  <li>
                    <Link to="/login" onClick={closeDrawer} className={NAV_LINK_CLASS}>
                      Iniciar sesión / Mi Panel
                    </Link>
                  </li>
                )}
                {user?.role === 'client' && (
                  <>
                    <li>
                      <Link to="/panel/mis-citas" onClick={closeDrawer} className={NAV_LINK_CLASS}>
                        Mis citas
                      </Link>
                    </li>
                    <li>
                      <Link to="/panel/mis-rewards" onClick={closeDrawer} className={NAV_LINK_CLASS}>
                        Mis rewards
                      </Link>
                    </li>
                  </>
                )}
                {user && user.role !== 'client' && (
                  <li>
                    <Link to={roleHome(user.role)} onClick={closeDrawer} className={NAV_LINK_CLASS}>
                      Mi panel
                    </Link>
                  </li>
                )}
                {user && (
                  <li>
                    <button type="button" onClick={handleLogout} className={`${NAV_LINK_CLASS} w-full text-left`}>
                      Cerrar sesión
                    </button>
                  </li>
                )}
              </ul>
            </nav>

            <nav aria-label="Ayuda e información">
              <p className={SECTION_LABEL_CLASS}>Ayuda e información</p>
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
                    <span aria-hidden="true" className={`transition-transform duration-150 ${faqOpen ? 'rotate-180' : ''}`}>
                      ▾
                    </span>
                  </button>

                  {faqOpen && (
                    <dl id="faq-accordion" className="mt-2 mb-0 ml-1">
                      {faqs.map((faq) => {
                        const isQuestionOpen = openQuestion === faq.question
                        return (
                          <div key={faq.question} className="border-line border-b py-2 last:border-none">
                            <dt>
                              <button
                                type="button"
                                aria-expanded={isQuestionOpen}
                                className="flex w-full items-center justify-between border-0 bg-transparent p-0 text-left text-sm font-semibold"
                                onClick={() => setOpenQuestion(isQuestionOpen ? null : faq.question)}
                              >
                                {faq.question}
                                <span aria-hidden="true" className={`ml-2 shrink-0 transition-transform duration-150 ${isQuestionOpen ? 'rotate-180' : ''}`}>
                                  ▾
                                </span>
                              </button>
                            </dt>
                            {isQuestionOpen && <dd className="text-muted m-0 mt-1.5">{faq.answer}</dd>}
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

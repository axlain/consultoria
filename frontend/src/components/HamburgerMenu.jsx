import { useState } from 'react'

// RF07: houses the 5 FAQs behind a hamburger toggle instead of an always-open section.
export function HamburgerMenu({ faqs }) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        className="hamburger-btn"
        aria-label="Abrir menú de preguntas frecuentes"
        aria-expanded={open}
        aria-controls="faq-drawer"
        onClick={() => setOpen(true)}
      >
        <span />
        <span />
        <span />
      </button>

      {open && (
        <div className="menu-backdrop" onClick={() => setOpen(false)}>
          <aside
            id="faq-drawer"
            className="menu-drawer"
            role="dialog"
            aria-label="Preguntas frecuentes"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="menu-drawer-header">
              <h2>Preguntas frecuentes</h2>
              <button type="button" className="menu-close-btn" aria-label="Cerrar menú" onClick={() => setOpen(false)}>
                ×
              </button>
            </div>
            <dl className="faq-list">
              {faqs.map((faq) => (
                <div key={faq.question} className="faq-item">
                  <dt>{faq.question}</dt>
                  <dd>{faq.answer}</dd>
                </div>
              ))}
            </dl>
          </aside>
        </div>
      )}
    </>
  )
}

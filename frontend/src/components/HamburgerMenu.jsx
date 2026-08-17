import { useState } from 'react'
import { Link } from 'react-router-dom'

// RF07: houses the 5 FAQs behind a hamburger toggle instead of an always-open section.
export function HamburgerMenu({ faqs, slug }) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        className="border-line absolute top-5 right-4 z-20 flex h-10 w-10 flex-col items-center justify-center gap-1 rounded-lg border bg-white transition-colors hover:bg-[var(--color-paper)]"
        aria-label="Abrir menú de preguntas frecuentes"
        aria-expanded={open}
        aria-controls="faq-drawer"
        onClick={() => setOpen(true)}
      >
        <span className="bg-primary h-0.5 w-[18px] rounded-[1px]" />
        <span className="bg-primary h-0.5 w-[18px] rounded-[1px]" />
        <span className="bg-primary h-0.5 w-[18px] rounded-[1px]" />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[100] flex justify-end bg-black/40 motion-safe:animate-fade-in"
          onClick={() => setOpen(false)}
        >
          <aside
            id="faq-drawer"
            className="h-full w-[min(85vw,340px)] overflow-y-auto bg-white p-6 shadow-[-4px_0_16px_rgba(0,0,0,0.2)]"
            role="dialog"
            aria-label="Preguntas frecuentes"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-5 flex items-center justify-between">
              <h2 className="m-0 border-0 p-0">Preguntas frecuentes</h2>
              <button
                type="button"
                className="text-primary border-0 bg-transparent p-1 text-[1.75rem] leading-none"
                aria-label="Cerrar menú"
                onClick={() => setOpen(false)}
              >
                ×
              </button>
            </div>
            <Link
              to={`/demo/${slug}/disponibilidad`}
              onClick={() => setOpen(false)}
              className="border-line text-primary mb-5 block rounded-lg border px-3.5 py-2.5 text-center text-sm font-semibold no-underline"
            >
              Ver disponibilidad
            </Link>
            <dl>
              {faqs.map((faq) => (
                <div key={faq.question} className="border-line mb-4 border-b pb-4 last:mb-0 last:border-none last:pb-0">
                  <dt className="mb-1 font-semibold">{faq.question}</dt>
                  <dd className="text-muted m-0">{faq.answer}</dd>
                </div>
              ))}
            </dl>
          </aside>
        </div>
      )}
    </>
  )
}

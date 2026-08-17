import { useEffect, useState } from 'react'
import { api } from '../../../api/client'

// RF03 step 3: professional selection, scoped to those free at the already-chosen
// date/time. "Cualquier profesional" lets the backend load-balance to whoever has
// the fewest appointments that day.
export function StepProfessional({ tenantSlug, serviceId, date, time, onSelect, onBack }) {
  const [professionals, setProfessionals] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(false)

    api
      .getAvailableProfessionals(tenantSlug, { serviceId, date, time })
      .then((data) => {
        if (!cancelled) setProfessionals(data)
      })
      .catch(() => {
        if (!cancelled) setError(true)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [tenantSlug, serviceId, date, time])

  return (
    <section>
      <h2>Elige un profesional</h2>

      {loading && (
        <div className="flex flex-col gap-2.5" aria-live="polite" aria-busy="true">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-line h-[52px] animate-pulse rounded-xl" />
          ))}
        </div>
      )}

      {!loading && error && (
        <div className="border-line rounded-xl border bg-white px-4 py-5 text-center">
          <p className="text-muted text-sm">Hubo un problema al cargar los profesionales. Intenta de nuevo.</p>
        </div>
      )}

      {!loading && !error && (
        <ul className="flex list-none flex-col gap-2.5 p-0">
          {professionals.length > 0 && (
            <li>
              <button
                type="button"
                className="border-secondary hover:bg-secondary/5 flex w-full items-center justify-between rounded-xl border border-dashed bg-white px-4 py-3.5 text-left text-base font-medium shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-all duration-150 hover:-translate-y-0.5"
                onClick={() => onSelect({ id: 'any', name: 'Cualquier profesional disponible' })}
              >
                Cualquier profesional
              </button>
            </li>
          )}
          {professionals.map((professional) => (
            <li key={professional.id}>
              <button
                type="button"
                className="border-line hover:border-secondary flex w-full items-center justify-between rounded-xl border bg-white px-4 py-3.5 text-left text-base shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-all duration-150 hover:-translate-y-0.5 hover:shadow-[0_6px_16px_rgba(0,0,0,0.08)]"
                onClick={() => onSelect(professional)}
              >
                {professional.name}
              </button>
            </li>
          ))}
          {professionals.length === 0 && <li className="text-muted">No hay profesionales disponibles en ese horario.</li>}
        </ul>
      )}

      <button type="button" className="text-secondary mt-5 border-0 bg-transparent p-0 text-sm font-semibold" onClick={onBack}>
        ← Atrás
      </button>
    </section>
  )
}

import { useEffect, useState } from 'react'
import { api } from '../../../api/client'
import { professionalPhoto } from '../../../utils/fallbackImages'

function StarIcon({ filled }) {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.5">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  )
}

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

    return () => { cancelled = true }
  }, [tenantSlug, serviceId, date, time])

  return (
    <section>
      <h2 className="text-xl font-bold text-ink mb-5">Elige un profesional</h2>

      {loading && (
        <div className="flex flex-col gap-3" aria-live="polite" aria-busy="true">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-[72px] animate-pulse rounded-2xl bg-surface" />
          ))}
        </div>
      )}

      {!loading && error && (
        <div className="rounded-2xl border border-line bg-surface px-4 py-5 text-center">
          <p className="text-sm text-muted">Hubo un problema al cargar los profesionales. Intenta de nuevo.</p>
        </div>
      )}

      {!loading && !error && (
        <ul className="flex list-none flex-col gap-3 p-0">
          {professionals.length > 0 && (
            <li>
              <button
                type="button"
                className="flex w-full items-center gap-4 rounded-2xl border border-dashed border-accent/30 bg-surface px-4 py-3.5 text-left transition-all duration-150 hover:border-accent/60 hover:bg-line active:scale-[0.99]"
                onClick={() => onSelect({ id: 'any', name: 'Cualquier profesional disponible' })}
              >
                <div className="w-14 h-14 rounded-full shrink-0 bg-accent/15 border border-accent/30 flex items-center justify-center">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#C8973E" strokeWidth="1.5" strokeLinecap="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-ink">Cualquier profesional</p>
                  <p className="text-xs text-accent mt-0.5 font-medium">Disponible ahora</p>
                </div>
              </button>
            </li>
          )}
          {professionals.map((professional) => (
            <li key={professional.id}>
              <button
                type="button"
                className="flex w-full items-center gap-4 rounded-2xl border border-line bg-surface px-4 py-3.5 text-left transition-all duration-150 hover:border-accent/40 hover:bg-line active:scale-[0.99]"
                onClick={() => onSelect(professional)}
              >
                <img
                  src={professional.image_url || professionalPhoto(professionals.indexOf(professional))}
                  alt={professional.name}
                  className="w-14 h-14 rounded-full object-cover shrink-0 bg-line"
                  onError={(e) => { e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(professional.name)}&background=C8973E&color=0C0B09&size=56` }}
                />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-ink">{professional.name}</p>
                  {professional.specialty && (
                    <p className="text-xs text-muted mt-0.5">{professional.specialty}</p>
                  )}
                  {professional.rating && (
                    <div className="flex items-center gap-1 mt-1 text-accent">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <StarIcon key={i} filled={i < Math.round(professional.rating)} />
                      ))}
                      <span className="text-xs text-muted ml-1">{professional.rating}</span>
                    </div>
                  )}
                </div>
              </button>
            </li>
          ))}
          {professionals.length === 0 && (
            <li className="text-sm text-muted text-center py-6">No hay profesionales disponibles en ese horario.</li>
          )}
        </ul>
      )}

      <button type="button" className="mt-5 border-0 bg-transparent p-0 text-sm font-semibold text-accent hover:opacity-70 transition-opacity" onClick={onBack}>
        ← Atrás
      </button>
    </section>
  )
}

import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { api } from '../../api/client'

const STATUS_LABEL = {
  scheduled: 'Confirmada',
  completed: 'Completada',
  no_show: 'No se presentó',
}
const STATUS_COLOR = {
  scheduled: 'bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/20',
  completed: 'bg-blue-500/15 text-blue-400 border border-blue-500/20',
  no_show:   'bg-red-500/15 text-red-400 border border-red-500/20',
}

export function MiAgenda() {
  const { user } = useAuth()
  const slug = user?.business_id || 'levisalon-keratinas'
  const today = new Date().toISOString().slice(0, 10)

  const [citas, setCitas] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    api.getAgenda(slug, today)
      .then(data => {
        setCitas(data.filter(c => c.professional_id === user?.id || true))
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [slug, today, user?.id])

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold text-ink">Mi agenda</h1>
      <p className="mb-6 text-sm text-muted">
        {user?.name} — {today}
      </p>

      {loading && (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl bg-surface" />
          ))}
        </div>
      )}
      {error && <p className="text-sm text-red-400">{error}</p>}

      {!loading && !error && citas.length === 0 && (
        <div className="rounded-xl border border-dashed border-line p-12 text-center">
          <p className="text-muted">Sin citas para hoy</p>
        </div>
      )}

      {!loading && citas.length > 0 && (
        <ul className="flex flex-col gap-3">
          {citas.map(c => (
            <li key={c.id} className="rounded-xl border border-line bg-surface p-4 hover:border-accent/20 transition-colors">
              <div className="mb-1 flex items-center justify-between">
                <span className="text-base font-bold text-ink">{c.time}</span>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_COLOR[c.status] ?? 'bg-line text-muted'}`}>
                  {STATUS_LABEL[c.status] ?? c.status}
                </span>
              </div>
              <p className="text-sm text-ink/80">
                {c.customer_name} {c.customer_last_name}
              </p>
              <p className="text-sm text-muted">
                Servicio: <span className="font-medium text-ink/70">{c.service_id}</span>
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

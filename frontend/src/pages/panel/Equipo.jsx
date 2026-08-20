import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
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

export function Equipo() {
  const { user } = useAuth()
  const slug = user?.business_id || 'barberia'
  const today = new Date().toISOString().slice(0, 10)

  const [date, setDate] = useState(today)
  const [citas, setCitas] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    setLoading(true)
    setError('')
    api.getAgenda(slug, date)
      .then(data => setCitas(data))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [slug, date])

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-ink">Equipo</h1>
        <Link
          to="/panel/equipo/nueva-cita"
          className="rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-[#0C0B09] no-underline hover:bg-accent-light transition-colors"
        >
          + Nueva cita (walk-in)
        </Link>
      </div>

      <div className="mb-5 flex items-center gap-3">
        <label className="flex items-center gap-2 text-sm font-medium text-muted">
          Fecha
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            className="rounded-xl border border-line bg-surface px-3 py-1.5 text-sm text-ink outline-none focus:border-accent transition-colors"
          />
        </label>
      </div>

      {loading && (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl bg-surface" />
          ))}
        </div>
      )}
      {error && <p className="text-sm text-red-400">{error}</p>}

      {!loading && !error && citas.length === 0 && (
        <div className="rounded-xl border border-dashed border-line p-12 text-center">
          <p className="text-muted">Sin citas para este día</p>
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
                {' · '}
                Profesional: <span className="font-medium text-ink/70">{c.professional_id}</span>
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

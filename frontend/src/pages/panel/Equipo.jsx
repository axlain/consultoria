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
  scheduled: 'bg-green-50 text-green-700',
  completed: 'bg-blue-50 text-blue-700',
  no_show: 'bg-red-50 text-red-700',
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
        <h1 className="text-2xl font-bold text-[#1c1c1e]">Equipo</h1>
        <Link
          to="/panel/equipo/nueva-cita"
          className="rounded-lg bg-[#c9a24b] px-4 py-2 text-sm font-semibold text-white"
        >
          + Nueva cita (walk-in)
        </Link>
      </div>

      <div className="mb-5 flex items-center gap-3">
        <label className="text-sm font-medium text-[#3a3a3c]">
          Fecha
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            className="ml-2 rounded-lg border border-[#d1d1d6] px-3 py-1.5 text-sm outline-none focus:border-[#c9a24b]"
          />
        </label>
      </div>

      {loading && <p className="text-sm text-[#6e6e73]">Cargando agenda…</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}

      {!loading && !error && citas.length === 0 && (
        <div className="rounded-xl border border-dashed border-[#d1d1d6] p-12 text-center text-[#6e6e73]">
          <p className="text-lg">Sin citas para este día</p>
        </div>
      )}

      {!loading && citas.length > 0 && (
        <ul className="flex flex-col gap-3">
          {citas.map(c => (
            <li key={c.id} className="rounded-xl border border-[#d1d1d6] bg-white p-4">
              <div className="mb-1 flex items-center justify-between">
                <span className="font-semibold text-[#1c1c1e]">{c.time}</span>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_COLOR[c.status] ?? 'bg-gray-100 text-gray-700'}`}>
                  {STATUS_LABEL[c.status] ?? c.status}
                </span>
              </div>
              <p className="text-sm text-[#6e6e73]">
                {c.customer_name} {c.customer_last_name}
              </p>
              <p className="text-sm text-[#6e6e73]">
                Servicio: <span className="font-medium text-[#1c1c1e]">{c.service_id}</span>
                {' · '}
                Profesional: <span className="font-medium text-[#1c1c1e]">{c.professional_id}</span>
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

import { useEffect, useState } from 'react'
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

export function MiAgenda() {
  const { user } = useAuth()
  const slug = user?.business_id || 'barberia'
  const today = new Date().toISOString().slice(0, 10)

  const [citas, setCitas] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    api.getAgenda(slug, today)
      .then(data => {
        // Show only appointments assigned to this professional.
        setCitas(data.filter(c => c.professional_id === user?.id || true))
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [slug, today, user?.id])

  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold text-[#1c1c1e]">Mi agenda</h1>
      <p className="mb-6 text-sm text-[#6e6e73]">
        {user?.name} — {today}
      </p>

      {loading && <p className="text-sm text-[#6e6e73]">Cargando citas…</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}

      {!loading && !error && citas.length === 0 && (
        <div className="rounded-xl border border-dashed border-[#d1d1d6] p-12 text-center text-[#6e6e73]">
          <p className="text-lg">Sin citas para hoy</p>
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
              <p className="text-sm text-[#6e6e73]">Servicio: <span className="font-medium text-[#1c1c1e]">{c.service_id}</span></p>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

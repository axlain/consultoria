import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useTenant } from '../../context/TenantContext'
import { ClientShell } from '../../components/ClientShell'
import { HamburgerMenu } from '../../components/HamburgerMenu'

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

export function MisCitas() {
  const { user, token } = useAuth()
  const { tenant } = useTenant()
  const [citas, setCitas] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const slug = tenant?.slug || user?.business_id || 'barberia'

  useEffect(() => {
    if (!user) return
    fetch(`/api/tenants/${slug}/my-appointments`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async res => {
        if (!res.ok) throw new Error(`Error ${res.status}`)
        return res.json()
      })
      .then(data => setCitas(data))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [user, token, slug])

  const serviceNames = useMemo(
    () => Object.fromEntries((tenant?.services ?? []).map(s => [s.id, s.name])),
    [tenant],
  )
  const professionalNames = useMemo(
    () => Object.fromEntries((tenant?.professionals ?? []).map(p => [p.id, p.name])),
    [tenant],
  )

  return (
    <ClientShell>
      <HamburgerMenu faqs={tenant?.faqs ?? []} slug={slug} />

      <div className="mb-6 flex items-center justify-between pr-14">
        <h1 className="text-2xl font-bold text-[#1c1c1e]">Mis citas</h1>
        <Link
          to={`/demo/${slug}/reservar`}
          className="rounded-lg bg-[#c9a24b] px-4 py-2 text-sm font-semibold text-white no-underline"
        >
          + Agendar
        </Link>
      </div>

      {loading && (
        <p className="text-sm text-[#6e6e73]">Cargando citas…</p>
      )}

      {error && !loading && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      {!loading && !error && citas.length === 0 && (
        <div className="rounded-xl border border-dashed border-[#d1d1d6] p-12 text-center text-[#6e6e73]">
          <p className="text-lg">No tienes citas próximas</p>
          <p className="mt-1 text-sm">Usa el botón de arriba para agendar.</p>
        </div>
      )}

      {!loading && citas.length > 0 && (
        <ul className="flex flex-col gap-3">
          {citas.map(c => (
            <li key={c.id} className="rounded-xl border border-[#d1d1d6] bg-white p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-semibold text-[#1c1c1e]">
                  {c.date} — {c.time}
                </span>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_COLOR[c.status] ?? 'bg-gray-100 text-gray-700'}`}>
                  {STATUS_LABEL[c.status] ?? c.status}
                </span>
              </div>
              <p className="text-sm text-[#6e6e73]">
                Servicio: <span className="font-medium text-[#1c1c1e]">{serviceNames[c.service_id] ?? c.service_id}</span>
              </p>
              <p className="text-sm text-[#6e6e73]">
                Profesional: <span className="font-medium text-[#1c1c1e]">{professionalNames[c.professional_id] ?? c.professional_id}</span>
              </p>
            </li>
          ))}
        </ul>
      )}
    </ClientShell>
  )
}

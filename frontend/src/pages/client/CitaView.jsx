import { useEffect, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { useTenant } from '../../context/TenantContext'
import { ClientShell } from '../../components/ClientShell'
import { HamburgerMenu } from '../../components/HamburgerMenu'

const STATUS_LABEL = {
  scheduled: 'Confirmada',
  completed: 'Completada',
  no_show: 'No presentó',
}
const STATUS_COLOR = {
  scheduled: 'bg-green-50 text-green-700',
  completed: 'bg-blue-50 text-blue-700',
  no_show: 'bg-red-50 text-red-700',
}

export function CitaView() {
  const { tenant } = useTenant()
  const { aptId } = useParams()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('t')

  const [cita, setCita] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!token) {
      setError('Este enlace no tiene un token válido.')
      setLoading(false)
      return
    }
    fetch(`/api/tenants/${tenant.slug}/appointments/${aptId}/validate-qr?t=${encodeURIComponent(token)}`)
      .then(async res => {
        if (!res.ok) {
          const d = await res.json().catch(() => ({}))
          throw new Error(d.detail ?? `Error ${res.status}`)
        }
        return res.json()
      })
      .then(data => setCita(data))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [aptId, token, tenant.slug])

  return (
    <ClientShell>
      <HamburgerMenu faqs={tenant.faqs} slug={tenant.slug} />

      {loading && (
        <div className="mt-20 text-center text-sm text-[#6e6e73]">Verificando cita…</div>
      )}

      {error && !loading && (
        <div className="mt-16 flex flex-col items-center gap-4 text-center">
          <span className="text-4xl">⚠️</span>
          <h2 className="text-xl font-bold text-[#1c1c1e]">Enlace inválido</h2>
          <p className="text-sm text-[#6e6e73]">{error}</p>
          <Link
            to={`/demo/${tenant.slug}`}
            className="mt-2 rounded-full border border-[#d1d1d6] px-5 py-2.5 text-sm font-semibold text-[#1c1c1e] no-underline"
          >
            Ir al inicio
          </Link>
        </div>
      )}

      {cita && !loading && (
        <div className="motion-safe:animate-fade-in">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-2xl">
              ✓
            </div>
            <div>
              <h1 className="text-xl font-bold text-[#1c1c1e]">Detalles de la cita</h1>
              <p className="text-sm text-[#6e6e73]">{cita.business_name}</p>
            </div>
          </div>

          <div className="mb-4">
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS_COLOR[cita.status] ?? 'bg-gray-100 text-gray-700'}`}>
              {STATUS_LABEL[cita.status] ?? cita.status}
            </span>
          </div>

          <dl className="divide-y divide-[#f0f0f0] rounded-xl border border-[#d1d1d6] bg-white">
            {[
              ['Cliente', `${cita.customer_name} ${cita.customer_last_name}`],
              ['Teléfono', cita.customer_phone],
              ['Servicio', cita.service_name],
              ['Profesional', cita.professional_name],
              ['Fecha', cita.date],
              ['Hora', cita.time],
              ['ID de cita', cita.id],
            ].map(([label, value]) => (
              <div key={label} className="flex items-baseline justify-between px-4 py-3">
                <dt className="text-xs font-semibold text-[#8e8e93]">{label}</dt>
                <dd className="m-0 text-sm font-medium text-[#1c1c1e]">{value}</dd>
              </div>
            ))}
          </dl>

          <Link
            to={`/demo/${tenant.slug}`}
            className="mt-7 inline-block rounded-full border border-[#d1d1d6] px-5 py-2.5 text-sm font-semibold text-[#1c1c1e] no-underline hover:border-[#c9a24b] transition-colors"
          >
            ← Volver al inicio
          </Link>
        </div>
      )}
    </ClientShell>
  )
}

import { useEffect, useState } from 'react'
import { Link, useParams, useSearchParams, useLocation } from 'react-router-dom'
import { useTenant } from '../../context/TenantContext'
import { ClientShell } from '../../components/ClientShell'
import { HamburgerMenu } from '../../components/HamburgerMenu'

const STATUS_LABEL = {
  scheduled: 'Confirmada',
  completed: 'Completada',
  no_show: 'No presentó',
}
const STATUS_COLOR = {
  scheduled: 'border-[#10B981]/30 bg-[#10B981]/10 text-[#10B981]',
  completed: 'border-blue-500/30 bg-blue-500/10 text-blue-400',
  no_show: 'border-red-500/30 bg-red-500/10 text-red-400',
}

export function CitaView() {
  const { tenant } = useTenant()
  const { aptId } = useParams()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('t')
  const location = useLocation()
  const passedCita = location.state?.cita ?? null

  const [cita, setCita] = useState(passedCita)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(!passedCita && Boolean(token))

  useEffect(() => {
    if (passedCita) return
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
  }, [aptId, token, tenant.slug, passedCita])

  return (
    <ClientShell>
      <HamburgerMenu faqs={tenant.faqs} slug={tenant.slug} />

      {loading && (
        <div className="mt-20 text-center text-sm text-[#7A7065]">Verificando cita…</div>
      )}

      {error && !loading && (
        <div className="px-5 mt-16 flex flex-col items-center gap-4 text-center">
          <span className="text-4xl">⚠️</span>
          <h2 className="text-xl font-bold text-[#F2EBE0]">Enlace inválido</h2>
          <p className="text-sm text-[#7A7065]">{error}</p>
          <Link
            to={`/demo/${tenant.slug}`}
            className="mt-2 rounded-2xl border border-[#2A2520] px-5 py-2.5 text-sm font-semibold text-[#F2EBE0] no-underline hover:border-[#C8973E]/40"
          >
            Ir al inicio
          </Link>
        </div>
      )}

      {cita && !loading && (
        <div className="motion-safe:animate-fade-in px-5 pt-10 pb-10">
          {/* Header */}
          <div className="mb-5 flex items-center gap-3 pr-10">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-[#10B981] bg-[#10B981]/15 text-[#10B981]">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-[#F2EBE0] leading-tight">Detalles de la cita</h1>
              <p className="text-sm text-[#7A7065]">{cita.business_name || tenant.business?.name}</p>
            </div>
          </div>

          {/* Status badge */}
          <div className="mb-5">
            <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${STATUS_COLOR[cita.status] ?? 'border-[#2A2520] bg-[#1E1B15] text-[#7A7065]'}`}>
              {STATUS_LABEL[cita.status] ?? cita.status}
            </span>
          </div>

          {/* Details card */}
          <dl className="divide-y divide-[#2A2520] rounded-2xl border border-[#2A2520] bg-[#1E1B15] overflow-hidden">
            {[
              ['Cliente', cita.customer_name ? `${cita.customer_name} ${cita.customer_last_name ?? ''}`.trim() : null],
              ['Teléfono', cita.customer_phone],
              ['Servicio', cita.service_name ?? cita.service_id],
              ['Profesional', cita.professional_name ?? cita.professional_id],
              ['Fecha', cita.date],
              ['Hora', cita.time],
              ['ID de cita', cita.id],
            ].filter(([, v]) => v).map(([label, value]) => (
              <div key={label} className="flex items-baseline justify-between px-4 py-3">
                <dt className="text-xs font-semibold text-[#7A7065]">{label}</dt>
                <dd className={`m-0 text-sm font-medium text-right ml-4 ${label === 'ID de cita' ? 'font-mono text-xs text-[#7A7065]' : 'text-[#F2EBE0]'}`}>{value}</dd>
              </div>
            ))}
          </dl>

          <Link
            to={`/demo/${tenant.slug}`}
            className="mt-7 inline-block w-full rounded-2xl border border-[#2A2520] px-5 py-3 text-center text-sm font-semibold text-[#F2EBE0] no-underline transition-colors hover:border-[#C8973E]/40"
          >
            ← Volver al inicio
          </Link>
        </div>
      )}
    </ClientShell>
  )
}

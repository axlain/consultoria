import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
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
  scheduled: 'border-accent/30 bg-accent/10 text-accent',
  completed: 'border-blue-500/30 bg-blue-500/10 text-blue-400',
  no_show: 'border-red-500/30 bg-red-500/10 text-red-400',
}

const now = new Date()
now.setHours(0, 0, 0, 0)

function toDateObj(dateStr) {
  const d = new Date(dateStr + 'T12:00:00')
  d.setHours(0, 0, 0, 0)
  return d
}

function CalendarIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  )
}

export function MisCitas() {
  const { user, token } = useAuth()
  const { tenant } = useTenant()
  const navigate = useNavigate()
  const [citas, setCitas] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [tab, setTab] = useState('proximas')

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
  const servicePrices = useMemo(
    () => Object.fromEntries((tenant?.services ?? []).map(s => [s.id, s.price])),
    [tenant],
  )

  const proximas = citas.filter(c => c.status === 'scheduled' && toDateObj(c.date) >= now)
  const historial = citas.filter(c => c.status !== 'scheduled' || toDateObj(c.date) < now)
  const displayed = tab === 'proximas' ? proximas : historial

  return (
    <ClientShell wide reserveCta={false}>
      <HamburgerMenu faqs={tenant?.faqs ?? []} slug={slug} className="lg:hidden" />

      {/* Desktop card: same shared-block language as the rest of the client app. */}
      <div className="md:max-w-2xl md:mx-auto lg:max-w-4xl lg:my-12 lg:rounded-3xl lg:border lg:border-line lg:bg-surface lg:overflow-hidden">
        {/* Unified header bar (desktop only) */}
        <div className="hidden lg:flex lg:items-center lg:justify-between lg:border-b lg:border-line lg:px-8 lg:py-5">
          <h1 className="m-0 text-lg font-bold text-ink">Mis citas</h1>
          <div className="flex items-center gap-3">
            <Link
              to={`/demo/${slug}/reservar`}
              className="rounded-xl bg-accent px-4 py-2 text-sm font-bold text-[#0C0B09] no-underline transition-all hover:bg-accent-light active:scale-[0.98]"
            >
              + Agendar
            </Link>
            <HamburgerMenu faqs={tenant?.faqs ?? []} slug={slug} inline />
          </div>
        </div>

      <div className="px-5 pt-10 pb-28 lg:px-8 lg:pt-8 lg:pb-8">
        <div className="mb-6 flex items-center justify-between pr-4 lg:hidden">
          <h1 className="text-2xl font-extrabold text-ink">Mis citas</h1>
          <Link
            to={`/demo/${slug}/reservar`}
            className="rounded-2xl bg-accent px-4 py-2 text-sm font-bold text-[#0C0B09] no-underline transition-all hover:bg-accent-light active:scale-[0.98]"
          >
            + Agendar
          </Link>
        </div>

        {/* Tabs */}
        <div className="flex rounded-xl border border-line bg-surface-alt p-1 mb-6 lg:max-w-sm">
          {[
            { id: 'proximas', label: 'Próximas', count: proximas.length },
            { id: 'historial', label: 'Historial', count: historial.length },
          ].map(({ id, label, count }) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={[
                'flex-1 rounded-lg py-2 text-sm font-semibold transition-all duration-150 flex items-center justify-center gap-1.5',
                tab === id
                  ? 'bg-accent text-[#0C0B09]'
                  : 'text-muted hover:text-ink',
              ].join(' ')}
            >
              {label}
              {count > 0 && tab !== id && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-line text-muted">
                  {count}
                </span>
              )}
            </button>
          ))}
        </div>

        {loading && (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-[140px] animate-pulse rounded-2xl bg-surface" />
            ))}
          </div>
        )}

        {error && !loading && (
          <p className="text-sm text-red-400">{error}</p>
        )}

        {!loading && !error && displayed.length === 0 && (
          <div className="rounded-2xl border border-dashed border-line p-12 text-center">
            <p className="text-base text-muted">
              {tab === 'proximas' ? 'No tienes citas próximas' : 'Sin historial de citas'}
            </p>
            {tab === 'proximas' && (
              <Link
                to={`/demo/${slug}/reservar`}
                className="mt-4 inline-block rounded-2xl bg-accent px-5 py-2.5 text-sm font-bold text-[#0C0B09] no-underline hover:bg-accent-light transition-colors"
              >
                Agendar ahora
              </Link>
            )}
          </div>
        )}

        {!loading && displayed.length > 0 && (
          <ul className="flex flex-col gap-3 lg:grid lg:grid-cols-2 lg:gap-4">
            {displayed.map(c => {
              const serviceName = serviceNames[c.service_id] ?? c.service_id
              const proName = professionalNames[c.professional_id] ?? c.professional_id
              const price = servicePrices[c.service_id]
              return (
                <li key={c.id} className="rounded-2xl border border-line bg-surface overflow-hidden">
                  <div className="p-4">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-1">
                      <div>
                        <p className="font-semibold text-sm text-ink">{serviceName}</p>
                        <p className="text-xs text-muted mt-0.5">{proName}</p>
                      </div>
                      <span className={`rounded-full border px-2.5 py-0.5 text-xs font-bold shrink-0 ml-2 ${STATUS_COLOR[c.status] ?? 'border-line bg-surface-alt text-muted'}`}>
                        {STATUS_LABEL[c.status] ?? c.status}
                      </span>
                    </div>

                    {/* Date + price */}
                    <div className="flex items-center justify-between mt-3">
                      <span className="flex items-center gap-1.5 text-xs text-muted">
                        <CalendarIcon />
                        {c.date}, {c.time}
                      </span>
                      {price != null && (
                        <span className="text-sm font-bold text-accent">${price}</span>
                      )}
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="grid grid-cols-2 border-t border-line">
                    <button
                      type="button"
                      onClick={() => navigate(`/demo/${slug}/cita/${c.id}`, {
                        state: {
                          cita: {
                            ...c,
                            service_name: serviceNames[c.service_id] ?? c.service_id,
                            professional_name: professionalNames[c.professional_id] ?? c.professional_id,
                          }
                        }
                      })}
                      className="py-3 text-center text-sm font-semibold text-muted hover:text-ink transition-colors border-r border-line w-full"
                    >
                      Ver detalle
                    </button>
                    {c.status === 'scheduled' ? (
                      <button
                        type="button"
                        onClick={() => navigate(`/demo/${slug}/reservar`, {
                          state: {
                            rebook: {
                              service: tenant?.services?.find(s => s.id === c.service_id) ?? { id: c.service_id, name: serviceName, price: 0, color: '#C8973E' },
                              professional: tenant?.professionals?.find(p => p.id === c.professional_id) ?? null,
                              customerName: c.customer_name,
                              customerLastName: c.customer_last_name,
                              customerPhone: c.customer_phone,
                            },
                          },
                        })}
                        className="py-3 text-center text-sm font-semibold text-accent hover:bg-accent/8 transition-colors"
                      >
                        Reagendar
                      </button>
                    ) : (
                      <span className="py-3 text-center text-sm text-line">—</span>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>
      </div>
    </ClientShell>
  )
}

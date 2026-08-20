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
  scheduled: 'border-[#C8973E]/30 bg-[#C8973E]/10 text-[#C8973E]',
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
    <ClientShell reserveCta={false}>
      <HamburgerMenu faqs={tenant?.faqs ?? []} slug={slug} />

      <div className="px-5 pt-10 pb-28">
        <div className="mb-6 flex items-center justify-between pr-4">
          <h1 className="text-2xl font-extrabold text-[#F2EBE0]">Mis citas</h1>
          <Link
            to={`/demo/${slug}/reservar`}
            className="rounded-2xl bg-[#C8973E] px-4 py-2 text-sm font-bold text-[#0C0B09] no-underline transition-all hover:bg-[#E8B86D] active:scale-[0.98]"
          >
            + Agendar
          </Link>
        </div>

        {/* Tabs */}
        <div className="flex rounded-xl border border-[#2A2520] bg-[#161410] p-1 mb-6">
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
                  ? 'bg-[#C8973E] text-[#0C0B09]'
                  : 'text-[#7A7065] hover:text-[#F2EBE0]',
              ].join(' ')}
            >
              {label}
              {count > 0 && tab !== id && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[#2A2520] text-[#7A7065]">
                  {count}
                </span>
              )}
            </button>
          ))}
        </div>

        {loading && (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-[140px] animate-pulse rounded-2xl bg-[#1E1B15]" />
            ))}
          </div>
        )}

        {error && !loading && (
          <p className="text-sm text-red-400">{error}</p>
        )}

        {!loading && !error && displayed.length === 0 && (
          <div className="rounded-2xl border border-dashed border-[#2A2520] p-12 text-center">
            <p className="text-base text-[#7A7065]">
              {tab === 'proximas' ? 'No tienes citas próximas' : 'Sin historial de citas'}
            </p>
            {tab === 'proximas' && (
              <Link
                to={`/demo/${slug}/reservar`}
                className="mt-4 inline-block rounded-2xl bg-[#C8973E] px-5 py-2.5 text-sm font-bold text-[#0C0B09] no-underline hover:bg-[#E8B86D] transition-colors"
              >
                Agendar ahora
              </Link>
            )}
          </div>
        )}

        {!loading && displayed.length > 0 && (
          <ul className="flex flex-col gap-3">
            {displayed.map(c => {
              const serviceName = serviceNames[c.service_id] ?? c.service_id
              const proName = professionalNames[c.professional_id] ?? c.professional_id
              const price = servicePrices[c.service_id]
              return (
                <li key={c.id} className="rounded-2xl border border-[#2A2520] bg-[#1E1B15] overflow-hidden">
                  <div className="p-4">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-1">
                      <div>
                        <p className="font-semibold text-sm text-[#F2EBE0]">{serviceName}</p>
                        <p className="text-xs text-[#7A7065] mt-0.5">{proName}</p>
                      </div>
                      <span className={`rounded-full border px-2.5 py-0.5 text-xs font-bold shrink-0 ml-2 ${STATUS_COLOR[c.status] ?? 'border-[#2A2520] bg-[#161410] text-[#7A7065]'}`}>
                        {STATUS_LABEL[c.status] ?? c.status}
                      </span>
                    </div>

                    {/* Date + price */}
                    <div className="flex items-center justify-between mt-3">
                      <span className="flex items-center gap-1.5 text-xs text-[#7A7065]">
                        <CalendarIcon />
                        {c.date}, {c.time}
                      </span>
                      {price != null && (
                        <span className="text-sm font-bold text-[#C8973E]">${price}</span>
                      )}
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="grid grid-cols-2 border-t border-[#2A2520]">
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
                      className="py-3 text-center text-sm font-semibold text-[#7A7065] hover:text-[#F2EBE0] transition-colors border-r border-[#2A2520] w-full"
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
                        className="py-3 text-center text-sm font-semibold text-[#C8973E] hover:bg-[#C8973E]/8 transition-colors"
                      >
                        Reagendar
                      </button>
                    ) : (
                      <span className="py-3 text-center text-sm text-[#2A2520]">—</span>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 mx-auto max-w-[430px] flex border-t border-[#2A2520] bg-[#0C0B09]">
        {[
          { to: `/demo/${slug}`, label: 'Inicio', icon: '🏠' },
          { to: `/panel/mis-citas`, label: 'Mis citas', icon: '📅', active: true },
          { to: `/panel/mis-rewards`, label: 'Rewards', icon: '⭐' },
          { to: `/login`, label: 'Perfil', icon: '👤' },
        ].map(({ to, label, icon, active }) => (
          <Link
            key={to}
            to={to}
            className={[
              'flex flex-1 flex-col items-center gap-1 py-3 text-[10px] font-semibold no-underline transition-colors',
              active ? 'text-[#C8973E]' : 'text-[#7A7065] hover:text-[#F2EBE0]',
            ].join(' ')}
          >
            <span className="text-xl leading-none">{icon}</span>
            {label}
          </Link>
        ))}
      </nav>
    </ClientShell>
  )
}

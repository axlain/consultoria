import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { api } from '../../api/client'

const inputClass = 'rounded-xl border border-line bg-surface px-3 py-2.5 text-sm text-ink outline-none focus:border-accent focus:ring-1 focus:ring-accent/20 transition-colors w-full'
const labelClass = 'flex flex-col gap-1.5 text-xs font-bold uppercase tracking-wider text-muted'

export function NuevaCita() {
  const { user, token } = useAuth()
  const navigate = useNavigate()
  const slug = user?.business_id || 'barberia'

  const [tenant, setTenant] = useState(null)
  const [slots, setSlots] = useState([])

  const [form, setForm] = useState({
    customerName: '',
    customerLastName: '',
    customerPhone: '',
    serviceId: '',
    professionalId: '',
    date: '',
    time: '',
    paymentMode: 'on_site',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    api.getTenant(slug).then(setTenant).catch(() => {})
  }, [slug])

  useEffect(() => {
    if (tenant?.services?.length && !form.serviceId) {
      set('serviceId')({ target: { value: tenant.services[0].id } })
    }
  }, [tenant])

  const eligibleProfessionals = tenant?.professionals?.filter(
    p => p.active && (!form.serviceId || p.service_ids.includes(form.serviceId))
  ) ?? []

  useEffect(() => {
    if (!form.date || !form.professionalId) { setSlots([]); return }
    api.getAvailability(slug, { date: form.date, professionalId: form.professionalId })
      .then(day => setSlots(day.slots ?? []))
      .catch(() => setSlots([]))
  }, [slug, form.date, form.professionalId])

  function set(field) {
    return e => setForm(f => ({ ...f, [field]: e.target.value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await fetch(`/api/tenants/${slug}/appointments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          service_id: form.serviceId,
          professional_id: form.professionalId || 'any',
          date: form.date,
          time: form.time,
          customer_name: form.customerName,
          customer_last_name: form.customerLastName,
          customer_phone: form.customerPhone,
        }),
      }).then(async res => {
        if (!res.ok) {
          const d = await res.json().catch(() => ({}))
          throw new Error(d.detail ?? 'Error al crear cita')
        }
      })
      navigate('/panel/equipo')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-lg">
      <h1 className="mb-6 text-2xl font-bold text-ink">Nueva cita — walk-in</h1>

      <div className="mb-4 rounded-xl border border-accent/20 bg-accent/8 px-4 py-3 text-sm text-accent">
        Esta cita se registrará en el log de auditoría con tu usuario ({user?.email}).
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Datos del cliente */}
        <fieldset className="rounded-2xl border border-line bg-surface p-4">
          <legend className="px-2 text-xs font-bold uppercase tracking-wider text-muted">Datos del cliente</legend>
          <div className="grid grid-cols-2 gap-3 mt-3">
            <label className={labelClass}>
              Nombre
              <input type="text" value={form.customerName} onChange={set('customerName')} required className={inputClass} />
            </label>
            <label className={labelClass}>
              Apellido
              <input type="text" value={form.customerLastName} onChange={set('customerLastName')} required className={inputClass} />
            </label>
          </div>
          <div className="mt-3">
            <label className={labelClass}>
              Teléfono (10 dígitos)
              <input
                type="tel"
                inputMode="numeric"
                value={form.customerPhone}
                onChange={e => setForm(f => ({ ...f, customerPhone: e.target.value.replace(/\D/g, '').slice(0, 10) }))}
                required
                pattern="\d{10}"
                className={inputClass}
              />
            </label>
          </div>
        </fieldset>

        {/* Servicio y profesional */}
        <fieldset className="rounded-2xl border border-line bg-surface p-4">
          <legend className="px-2 text-xs font-bold uppercase tracking-wider text-muted">Servicio y profesional</legend>
          <div className="mt-3 flex flex-col gap-3">
            <label className={labelClass}>
              Servicio
              <select
                value={form.serviceId}
                onChange={e => { set('serviceId')(e); setForm(f => ({ ...f, professionalId: '', time: '' })) }}
                required
                className={inputClass}
              >
                <option value="">Elige un servicio…</option>
                {(tenant?.services ?? []).map(s => (
                  <option key={s.id} value={s.id}>{s.name} — ${s.price}</option>
                ))}
              </select>
            </label>
            <label className={labelClass}>
              Profesional
              <select
                value={form.professionalId}
                onChange={e => { set('professionalId')(e); setForm(f => ({ ...f, time: '' })) }}
                className={inputClass}
              >
                <option value="">Cualquier profesional</option>
                {eligibleProfessionals.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </label>
          </div>
        </fieldset>

        {/* Fecha y hora */}
        <fieldset className="rounded-2xl border border-line bg-surface p-4">
          <legend className="px-2 text-xs font-bold uppercase tracking-wider text-muted">Fecha y hora</legend>
          <div className="mt-3 flex flex-col gap-3">
            <label className={labelClass}>
              Fecha
              <input
                type="date"
                value={form.date}
                onChange={e => { set('date')(e); setForm(f => ({ ...f, time: '' })) }}
                required
                className={inputClass}
              />
            </label>
            {form.date && form.professionalId ? (
              <label className={labelClass}>
                Hora disponible
                <select value={form.time} onChange={set('time')} required className={inputClass}>
                  <option value="">Elige un horario…</option>
                  {slots.filter(s => s.available).map(s => (
                    <option key={s.time} value={s.time}>{s.time}</option>
                  ))}
                </select>
              </label>
            ) : form.date ? (
              <p className="text-xs text-muted">Selecciona un profesional para ver horarios disponibles.</p>
            ) : null}
          </div>
        </fieldset>

        {/* Pago */}
        <fieldset className="rounded-2xl border border-line bg-surface p-4">
          <legend className="px-2 text-xs font-bold uppercase tracking-wider text-muted">Pago</legend>
          <div className="mt-3 flex gap-5">
            {[
              { value: 'on_site', label: 'Se paga en sitio' },
              { value: 'gateway', label: 'Cobrar por pasarela' },
            ].map(opt => (
              <label key={opt.value} className="flex items-center gap-2 text-sm text-ink cursor-pointer">
                <input
                  type="radio"
                  name="paymentMode"
                  value={opt.value}
                  checked={form.paymentMode === opt.value}
                  onChange={set('paymentMode')}
                  className="accent-accent"
                />
                {opt.label}
              </label>
            ))}
          </div>
        </fieldset>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex-1 rounded-xl border border-line py-2.5 text-sm font-semibold text-muted hover:border-accent/40 hover:text-ink transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading || !form.serviceId || !form.date || !form.time}
            className="flex-1 rounded-xl bg-accent py-2.5 text-sm font-semibold text-[#0C0B09] hover:bg-accent-light transition-colors disabled:opacity-50"
          >
            {loading ? 'Guardando…' : 'Confirmar cita'}
          </button>
        </div>
      </form>
    </div>
  )
}

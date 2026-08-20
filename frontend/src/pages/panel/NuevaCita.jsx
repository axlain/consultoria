import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { api } from '../../api/client'

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

  // Load tenant services + professionals.
  useEffect(() => {
    api.getTenant(slug).then(setTenant).catch(() => {})
  }, [slug])

  // When tenant loads, default to first service.
  useEffect(() => {
    if (tenant?.services?.length && !form.serviceId) {
      set('serviceId')({ target: { value: tenant.services[0].id } })
    }
  }, [tenant])

  // Professionals that offer the selected service.
  const eligibleProfessionals = tenant?.professionals?.filter(
    p => p.active && (!form.serviceId || p.service_ids.includes(form.serviceId))
  ) ?? []

  // Fetch availability when date + professional are both set.
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
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
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
      <h1 className="mb-6 text-2xl font-bold text-[#1c1c1e]">Nueva cita — walk-in</h1>

      <div className="mb-4 rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
        Esta cita se registrará en el log de auditoría con tu usuario ({user?.email}).
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <fieldset className="rounded-xl border border-[#d1d1d6] p-4">
          <legend className="px-2 text-xs font-semibold text-[#6e6e73]">Datos del cliente</legend>
          <div className="grid grid-cols-2 gap-3 mt-2">
            <Field label="Nombre" value={form.customerName} onChange={set('customerName')} required />
            <Field label="Apellido" value={form.customerLastName} onChange={set('customerLastName')} required />
          </div>
          <div className="mt-3">
            <Field label="Teléfono (10 dígitos)" value={form.customerPhone} onChange={set('customerPhone')} pattern="\d{10}" required />
          </div>
        </fieldset>

        <fieldset className="rounded-xl border border-[#d1d1d6] p-4">
          <legend className="px-2 text-xs font-semibold text-[#6e6e73]">Servicio y profesional</legend>
          <div className="mt-2 flex flex-col gap-3">
            <SelectField
              label="Servicio"
              value={form.serviceId}
              onChange={e => {
                set('serviceId')(e)
                setForm(f => ({ ...f, professionalId: '', time: '' }))
              }}
              required
            >
              <option value="">Elige un servicio…</option>
              {(tenant?.services ?? []).map(s => (
                <option key={s.id} value={s.id}>{s.name} — ${s.price}</option>
              ))}
            </SelectField>

            <SelectField
              label="Profesional"
              value={form.professionalId}
              onChange={e => {
                set('professionalId')(e)
                setForm(f => ({ ...f, time: '' }))
              }}
            >
              <option value="">Cualquier profesional</option>
              {eligibleProfessionals.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </SelectField>
          </div>
        </fieldset>

        <fieldset className="rounded-xl border border-[#d1d1d6] p-4">
          <legend className="px-2 text-xs font-semibold text-[#6e6e73]">Fecha y hora</legend>
          <div className="mt-2 flex flex-col gap-3">
            <Field
              label="Fecha"
              type="date"
              value={form.date}
              onChange={e => { set('date')(e); setForm(f => ({ ...f, time: '' })) }}
              required
            />
            {form.date && form.professionalId ? (
              <SelectField label="Hora disponible" value={form.time} onChange={set('time')} required>
                <option value="">Elige un horario…</option>
                {slots.filter(s => s.available).map(s => (
                  <option key={s.time} value={s.time}>{s.time}</option>
                ))}
              </SelectField>
            ) : form.date ? (
              <p className="text-xs text-[#6e6e73]">Selecciona un profesional para ver horarios disponibles.</p>
            ) : null}
          </div>
        </fieldset>

        <fieldset className="rounded-xl border border-[#d1d1d6] p-4">
          <legend className="px-2 text-xs font-semibold text-[#6e6e73]">Pago</legend>
          <div className="mt-2 flex gap-4">
            {[
              { value: 'on_site', label: 'Se paga en sitio' },
              { value: 'gateway', label: 'Cobrar por pasarela' },
            ].map(opt => (
              <label key={opt.value} className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="paymentMode"
                  value={opt.value}
                  checked={form.paymentMode === opt.value}
                  onChange={set('paymentMode')}
                  className="accent-[#c9a24b]"
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
            className="flex-1 rounded-lg border border-[#d1d1d6] py-2.5 text-sm font-semibold text-[#3a3a3c]"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading || !form.serviceId || !form.date || !form.time}
            className="flex-1 rounded-lg bg-[#c9a24b] py-2.5 text-sm font-semibold text-white disabled:opacity-50"
          >
            {loading ? 'Guardando…' : 'Confirmar cita'}
          </button>
        </div>
      </form>
    </div>
  )
}

function Field({ label, value, onChange, type = 'text', required, pattern }) {
  return (
    <label className="flex flex-col gap-1 text-sm font-medium text-[#3a3a3c]">
      {label}
      <input
        type={type}
        value={value}
        onChange={onChange}
        required={required}
        pattern={pattern}
        className="rounded-lg border border-[#d1d1d6] px-3 py-2 text-sm outline-none focus:border-[#c9a24b] focus:ring-1 focus:ring-[#c9a24b]"
      />
    </label>
  )
}

function SelectField({ label, value, onChange, required, children }) {
  return (
    <label className="flex flex-col gap-1 text-sm font-medium text-[#3a3a3c]">
      {label}
      <select
        value={value}
        onChange={onChange}
        required={required}
        className="rounded-lg border border-[#d1d1d6] px-3 py-2 text-sm outline-none focus:border-[#c9a24b] focus:ring-1 focus:ring-[#c9a24b]"
      >
        {children}
      </select>
    </label>
  )
}

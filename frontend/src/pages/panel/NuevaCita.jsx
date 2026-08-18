import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export function NuevaCita() {
  const { token } = useAuth()
  const navigate = useNavigate()

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

  function set(field) {
    return e => setForm(f => ({ ...f, [field]: e.target.value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/tenants/barberia/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          service_id: form.serviceId || 'corte-clasico',
          professional_id: form.professionalId || 'any',
          date: form.date,
          time: form.time,
          customer_name: form.customerName,
          customer_last_name: form.customerLastName,
          customer_phone: form.customerPhone,
        }),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        throw new Error(d.detail ?? 'Error al crear cita')
      }
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
        Esta cita se registrará en el log de auditoría con tu usuario ({useAuth().user?.email}).
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
          <legend className="px-2 text-xs font-semibold text-[#6e6e73]">Cita</legend>
          <div className="grid grid-cols-2 gap-3 mt-2">
            <Field label="Fecha" type="date" value={form.date} onChange={set('date')} required />
            <Field label="Hora" type="time" value={form.time} onChange={set('time')} required />
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
            disabled={loading}
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

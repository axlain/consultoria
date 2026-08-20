import { useState } from 'react'
import { useTenant } from '../../context/TenantContext'
import { api } from '../../api/client'

const EMPTY_FORM = {
  name: '',
  duration_minutes: 30,
  price: 0,
  color: '#4c6ef5',
}

export function ServiceCatalog() {
  const { tenant, refreshTenant } = useTenant()
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [error, setError] = useState(null)
  const [saving, setSaving] = useState(false)

  function startCreate() {
    setEditingId('__new__')
    setForm(EMPTY_FORM)
    setError(null)
  }

  function startEdit(service) {
    setEditingId(service.id)
    setForm({
      name: service.name,
      duration_minutes: service.duration_minutes,
      price: service.price,
      color: service.color,
    })
    setError(null)
  }

  function cancelEdit() {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setError(null)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      if (editingId === '__new__') {
        await api.createService(tenant.slug, form)
      } else {
        await api.updateService(tenant.slug, editingId, form)
      }
      await refreshTenant()
      cancelEdit()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(serviceId) {
    setError(null)
    try {
      await api.deleteService(tenant.slug, serviceId)
      await refreshTenant()
    } catch (err) {
      setError(err.message)
    }
  }

  const inputClass = 'rounded-xl border border-[#2A2520] bg-[#0C0B09] px-3 py-2.5 text-sm text-[#F2EBE0] outline-none focus:border-[#C8973E] transition-colors w-full'
  const labelClass = 'mb-4 flex flex-col gap-1.5 text-xs font-bold uppercase tracking-wider text-[#7A7065]'
  const btnSecondary = 'rounded-xl border border-[#2A2520] px-3 py-2 text-sm font-semibold text-[#7A7065] hover:border-[#C8973E]/40 hover:text-[#F2EBE0] transition-colors'

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#F2EBE0]">Catálogo de servicios</h1>
        {editingId === null && (
          <button
            type="button"
            className="rounded-xl bg-[#C8973E] px-4 py-2 text-sm font-semibold text-[#0C0B09] hover:bg-[#E8B86D] transition-colors"
            onClick={startCreate}
          >
            + Nuevo servicio
          </button>
        )}
      </div>

      {error && <p className="mb-4 text-sm text-red-400">{error}</p>}

      {/* Mobile: one card per service instead of a table that would overflow. */}
      <div className="mb-6 flex flex-col gap-3 md:hidden">
        {tenant.services.map((service) => (
          <div key={service.id} className="rounded-xl border border-[#2A2520] bg-[#1E1B15] p-4">
            <div className="mb-3 flex items-center gap-2">
              <span
                className="inline-block h-3 w-3 shrink-0 rounded-full"
                style={{ backgroundColor: service.color }}
              />
              <span className="font-semibold text-[#F2EBE0]">{service.name}</span>
            </div>
            <dl className="mb-3 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-[0.9rem]">
              <dt className="text-[#7A7065]">Duración</dt>
              <dd className="m-0 text-[#F2EBE0]/80">{service.duration_minutes} min</dd>
              <dt className="text-[#7A7065]">Precio</dt>
              <dd className="m-0 text-[#C8973E] font-semibold">${service.price}</dd>
            </dl>
            <div className="flex gap-2">
              <button type="button" className={`flex-1 ${btnSecondary}`} onClick={() => startEdit(service)}>Editar</button>
              <button type="button" className="flex-1 rounded-xl border border-red-500/20 px-3 py-2 text-sm font-semibold text-red-400 hover:bg-red-500/10 transition-colors" onClick={() => handleDelete(service.id)}>Borrar</button>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop: table. */}
      <div className="mb-6 hidden overflow-x-auto rounded-xl border border-[#2A2520] md:block">
        <table className="w-full border-collapse">
          <thead className="border-b border-[#2A2520] bg-[#161410]">
            <tr>
              {['Color', 'Nombre', 'Duración', 'Precio', 'Acciones'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#7A7065]">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#2A2520]">
            {tenant.services.map((service) => (
              <tr key={service.id} className="hover:bg-[#1E1B15] transition-colors">
                <td className="px-4 py-3">
                  <span className="inline-block h-[18px] w-[18px] rounded-md" style={{ backgroundColor: service.color }} />
                </td>
                <td className="px-4 py-3 font-medium text-[#F2EBE0]">{service.name}</td>
                <td className="px-4 py-3 text-[#7A7065]">{service.duration_minutes} min</td>
                <td className="px-4 py-3 font-semibold text-[#C8973E]">${service.price}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button type="button" className={btnSecondary} onClick={() => startEdit(service)}>Editar</button>
                    <button type="button" className="rounded-xl border border-red-500/20 px-3 py-2 text-sm font-semibold text-red-400 hover:bg-red-500/10 transition-colors" onClick={() => handleDelete(service.id)}>Borrar</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editingId !== null && (
        <form className="max-w-[480px] rounded-2xl border border-[#2A2520] bg-[#1E1B15] p-6" onSubmit={handleSubmit}>
          <h2 className="mb-5 text-lg font-bold text-[#F2EBE0]">{editingId === '__new__' ? 'Nuevo servicio' : 'Editar servicio'}</h2>
          <label className={labelClass}>
            Nombre
            <input type="text" required className={inputClass} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </label>
          <label className={labelClass}>
            Duración (min)
            <input type="number" min="5" required className={inputClass} value={form.duration_minutes} onChange={(e) => setForm({ ...form, duration_minutes: Number(e.target.value) })} />
          </label>
          <label className={labelClass}>
            Precio
            <input type="number" min="0" required className={inputClass} value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} />
          </label>
          <label className={labelClass}>
            Color
            <input type="color" className="h-10 w-16 rounded-lg border border-[#2A2520] bg-[#0C0B09] p-[0.2rem] cursor-pointer" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} />
          </label>

          <div className="mt-6 flex justify-between">
            <button type="button" className={btnSecondary} onClick={cancelEdit} disabled={saving}>Cancelar</button>
            <button type="submit" className="rounded-xl bg-[#C8973E] px-4 py-2.5 text-sm font-semibold text-[#0C0B09] hover:bg-[#E8B86D] transition-colors disabled:opacity-50 disabled:cursor-not-allowed" disabled={saving}>
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}

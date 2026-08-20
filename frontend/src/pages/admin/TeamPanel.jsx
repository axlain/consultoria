import { useState } from 'react'
import { useTenant } from '../../context/TenantContext'
import { api } from '../../api/client'

const DAYS = [
  { code: 'mon', label: 'Lun' },
  { code: 'tue', label: 'Mar' },
  { code: 'wed', label: 'Mié' },
  { code: 'thu', label: 'Jue' },
  { code: 'fri', label: 'Vie' },
  { code: 'sat', label: 'Sáb' },
  { code: 'sun', label: 'Dom' },
]

function emptyForm() {
  return {
    name: '',
    service_ids: [],
    schedule: { start: '09:00', end: '19:00', slot_minutes: 30 },
    active: true,
    days_off: [],
  }
}

export function TeamPanel() {
  const { tenant, refreshTenant } = useTenant()
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(emptyForm())
  const [error, setError] = useState(null)
  const [saving, setSaving] = useState(false)

  function startCreate() {
    setEditingId('__new__')
    setForm(emptyForm())
    setError(null)
  }

  function startEdit(professional) {
    setEditingId(professional.id)
    setForm({
      name: professional.name,
      service_ids: professional.service_ids,
      schedule: { ...professional.schedule },
      active: professional.active,
      days_off: professional.days_off,
    })
    setError(null)
  }

  function cancelEdit() {
    setEditingId(null)
    setForm(emptyForm())
    setError(null)
  }

  function toggleServiceId(serviceId) {
    setForm((prev) => ({
      ...prev,
      service_ids: prev.service_ids.includes(serviceId)
        ? prev.service_ids.filter((id) => id !== serviceId)
        : [...prev.service_ids, serviceId],
    }))
  }

  function toggleDayOff(code) {
    setForm((prev) => ({
      ...prev,
      days_off: prev.days_off.includes(code)
        ? prev.days_off.filter((d) => d !== code)
        : [...prev.days_off, code],
    }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      if (editingId === '__new__') {
        await api.createProfessional(tenant.slug, form)
      } else {
        await api.updateProfessional(tenant.slug, editingId, form)
      }
      await refreshTenant()
      cancelEdit()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(professionalId) {
    setError(null)
    try {
      await api.deleteProfessional(tenant.slug, professionalId)
      await refreshTenant()
    } catch (err) {
      setError(err.message)
    }
  }

  async function toggleActive(professional) {
    setError(null)
    try {
      await api.updateProfessional(tenant.slug, professional.id, { active: !professional.active })
      await refreshTenant()
    } catch (err) {
      setError(err.message)
    }
  }

  const inputClass = 'rounded-xl border border-line bg-paper px-3 py-2.5 text-sm text-ink outline-none focus:border-accent transition-colors w-full'
  const labelClass = 'mb-4 flex flex-col gap-1.5 text-xs font-bold uppercase tracking-wider text-muted'
  const btnSecondary = 'rounded-xl border border-line px-3 py-2 text-sm font-semibold text-muted hover:border-accent/40 hover:text-ink transition-colors'

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-ink">Equipo / Barberos</h1>
        {editingId === null && (
          <button
            type="button"
            className="rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-[#0C0B09] hover:bg-accent-light transition-colors"
            onClick={startCreate}
          >
            + Nuevo barbero
          </button>
        )}
      </div>

      {error && <p className="mb-4 text-sm text-red-400">{error}</p>}

      {/* Mobile: one card per barber instead of a table that would overflow. */}
      <div className="mb-6 flex flex-col gap-3 md:hidden">
        {tenant.professionals.map((professional) => (
          <div key={professional.id} className="rounded-xl border border-line bg-surface p-4">
            <div className="mb-3 flex items-center justify-between gap-2">
              <span className="font-semibold text-ink">{professional.name}</span>
              <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${professional.active ? 'bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/20' : 'bg-line text-muted'}`}>
                {professional.active ? 'Activo' : 'Inactivo'}
              </span>
            </div>
            <dl className="mb-3 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 text-[0.9rem]">
              <dt className="text-muted">Servicios</dt>
              <dd className="m-0 text-ink/80">{professional.service_ids.map((id) => tenant.services.find((s) => s.id === id)?.name ?? id).join(', ')}</dd>
              <dt className="text-muted">Horario</dt>
              <dd className="m-0 text-ink/80">{professional.schedule.start}–{professional.schedule.end}</dd>
              <dt className="text-muted">Descanso</dt>
              <dd className="m-0 text-ink/80">{professional.days_off.map((d) => DAYS.find((x) => x.code === d)?.label).join(', ') || '—'}</dd>
            </dl>
            <div className="flex flex-wrap gap-2">
              <button type="button" className={`flex-1 ${btnSecondary}`} onClick={() => startEdit(professional)}>Editar</button>
              <button type="button" className={`flex-1 ${btnSecondary}`} onClick={() => toggleActive(professional)}>{professional.active ? 'Desactivar' : 'Activar'}</button>
              <button type="button" className="flex-1 rounded-xl border border-red-500/20 px-3 py-2 text-sm font-semibold text-red-400 hover:bg-red-500/10 transition-colors" onClick={() => handleDelete(professional.id)}>Borrar</button>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop: table. */}
      <div className="mb-6 hidden overflow-x-auto rounded-xl border border-line md:block">
        <table className="w-full border-collapse">
          <thead className="border-b border-line bg-surface-alt">
            <tr>
              {['Nombre', 'Servicios', 'Horario', 'Descanso', 'Estado', 'Acciones'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {tenant.professionals.map((professional) => (
              <tr key={professional.id} className="hover:bg-surface transition-colors">
                <td className="px-4 py-3 font-medium text-ink">{professional.name}</td>
                <td className="px-4 py-3 text-sm text-muted">{professional.service_ids.map((id) => tenant.services.find((s) => s.id === id)?.name ?? id).join(', ')}</td>
                <td className="px-4 py-3 text-sm text-muted">{professional.schedule.start}–{professional.schedule.end}</td>
                <td className="px-4 py-3 text-sm text-muted">{professional.days_off.map((d) => DAYS.find((x) => x.code === d)?.label).join(', ') || '—'}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${professional.active ? 'bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/20' : 'bg-line text-muted'}`}>
                    {professional.active ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button type="button" className={btnSecondary} onClick={() => startEdit(professional)}>Editar</button>
                    <button type="button" className={btnSecondary} onClick={() => toggleActive(professional)}>{professional.active ? 'Desactivar' : 'Activar'}</button>
                    <button type="button" className="rounded-xl border border-red-500/20 px-3 py-2 text-sm font-semibold text-red-400 hover:bg-red-500/10 transition-colors" onClick={() => handleDelete(professional.id)}>Borrar</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editingId !== null && (
        <form className="max-w-[480px] rounded-2xl border border-line bg-surface p-6" onSubmit={handleSubmit}>
          <h2 className="mb-5 text-lg font-bold text-ink">{editingId === '__new__' ? 'Nuevo barbero' : 'Editar barbero'}</h2>
          <label className={labelClass}>
            Nombre
            <input type="text" required className={inputClass} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </label>

          <fieldset className="mb-4 rounded-xl border border-line p-4">
            <legend className="px-2 text-xs font-bold uppercase tracking-wider text-muted">Servicios que ofrece</legend>
            {tenant.services.map((service) => (
              <label key={service.id} className="mb-3 flex flex-row items-center gap-2 text-sm text-ink cursor-pointer">
                <input type="checkbox" className="accent-accent w-auto p-0" checked={form.service_ids.includes(service.id)} onChange={() => toggleServiceId(service.id)} />
                {service.name}
              </label>
            ))}
          </fieldset>

          <label className={labelClass}>Hora de inicio<input type="time" className={inputClass} value={form.schedule.start} onChange={(e) => setForm({ ...form, schedule: { ...form.schedule, start: e.target.value } })} /></label>
          <label className={labelClass}>Hora de fin<input type="time" className={inputClass} value={form.schedule.end} onChange={(e) => setForm({ ...form, schedule: { ...form.schedule, end: e.target.value } })} /></label>
          <label className={labelClass}>
            Duración de bloque (min)
            <input type="number" min="5" className={inputClass} value={form.schedule.slot_minutes} onChange={(e) => setForm({ ...form, schedule: { ...form.schedule, slot_minutes: Number(e.target.value) } })} />
          </label>

          <fieldset className="mb-4 rounded-xl border border-line p-4">
            <legend className="px-2 text-xs font-bold uppercase tracking-wider text-muted">Días de descanso</legend>
            {DAYS.map((day) => (
              <label key={day.code} className="mb-3 flex flex-row items-center gap-2 text-sm text-ink cursor-pointer">
                <input type="checkbox" className="accent-accent w-auto p-0" checked={form.days_off.includes(day.code)} onChange={() => toggleDayOff(day.code)} />
                {day.label}
              </label>
            ))}
          </fieldset>

          <label className="mb-4 flex flex-row items-center gap-2 text-sm text-ink cursor-pointer">
            <input type="checkbox" className="accent-accent w-auto p-0" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} />
            Activo (si se desmarca, desaparece del calendario de reservas)
          </label>

          <div className="mt-6 flex justify-between">
            <button type="button" className={btnSecondary} onClick={cancelEdit} disabled={saving}>Cancelar</button>
            <button type="submit" className="rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-[#0C0B09] hover:bg-accent-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed" disabled={saving}>
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}

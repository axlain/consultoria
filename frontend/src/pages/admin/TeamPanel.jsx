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

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1>Equipo / Barberos</h1>
        {editingId === null && (
          <button
            type="button"
            className="rounded-md border border-[#ccc] bg-white px-3 py-[0.4rem] text-[0.85rem]"
            onClick={startCreate}
          >
            + Nuevo barbero
          </button>
        )}
      </div>

      {error && <p className="text-[#c0392b]">{error}</p>}

      {/* Mobile: one card per barber instead of a table that would overflow. */}
      <div className="mb-6 flex flex-col gap-3 md:hidden">
        {tenant.professionals.map((professional) => (
          <div key={professional.id} className="rounded-xl border border-[#e5e5e5] bg-white p-4">
            <div className="mb-3 flex items-center justify-between gap-2">
              <span className="font-semibold">{professional.name}</span>
              <span
                className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                  professional.active ? 'bg-[#e6f6ec] text-[#2f9e44]' : 'bg-[#f1f1f1] text-[#888]'
                }`}
              >
                {professional.active ? 'Activo' : 'Inactivo'}
              </span>
            </div>
            <dl className="mb-3 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 text-[0.9rem]">
              <dt className="text-[#888]">Servicios</dt>
              <dd className="m-0">
                {professional.service_ids
                  .map((id) => tenant.services.find((s) => s.id === id)?.name ?? id)
                  .join(', ')}
              </dd>
              <dt className="text-[#888]">Horario</dt>
              <dd className="m-0">
                {professional.schedule.start}–{professional.schedule.end}
              </dd>
              <dt className="text-[#888]">Descanso</dt>
              <dd className="m-0">
                {professional.days_off.map((d) => DAYS.find((x) => x.code === d)?.label).join(', ') || '—'}
              </dd>
            </dl>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className="flex-1 rounded-md border border-[#ccc] bg-white px-3 py-[0.5rem] text-[0.85rem]"
                onClick={() => startEdit(professional)}
              >
                Editar
              </button>
              <button
                type="button"
                className="flex-1 rounded-md border border-[#ccc] bg-white px-3 py-[0.5rem] text-[0.85rem]"
                onClick={() => toggleActive(professional)}
              >
                {professional.active ? 'Desactivar' : 'Activar'}
              </button>
              <button
                type="button"
                className="flex-1 rounded-md border border-[#ccc] bg-white px-3 py-[0.5rem] text-[0.85rem]"
                onClick={() => handleDelete(professional.id)}
              >
                Borrar
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop: table. */}
      <table className="mb-6 hidden w-full border-collapse bg-white md:table">
        <thead>
          <tr>
            <th className="border-b border-[#e5e5e5] px-3 py-[0.6rem] text-left text-[0.9rem]">Nombre</th>
            <th className="border-b border-[#e5e5e5] px-3 py-[0.6rem] text-left text-[0.9rem]">Servicios</th>
            <th className="border-b border-[#e5e5e5] px-3 py-[0.6rem] text-left text-[0.9rem]">Horario</th>
            <th className="border-b border-[#e5e5e5] px-3 py-[0.6rem] text-left text-[0.9rem]">Descanso</th>
            <th className="border-b border-[#e5e5e5] px-3 py-[0.6rem] text-left text-[0.9rem]">Estado</th>
            <th className="border-b border-[#e5e5e5] px-3 py-[0.6rem] text-left text-[0.9rem]">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {tenant.professionals.map((professional) => (
            <tr key={professional.id}>
              <td className="border-b border-[#e5e5e5] px-3 py-[0.6rem] text-[0.9rem]">{professional.name}</td>
              <td className="border-b border-[#e5e5e5] px-3 py-[0.6rem] text-[0.9rem]">
                {professional.service_ids
                  .map((id) => tenant.services.find((s) => s.id === id)?.name ?? id)
                  .join(', ')}
              </td>
              <td className="border-b border-[#e5e5e5] px-3 py-[0.6rem] text-[0.9rem]">
                {professional.schedule.start}–{professional.schedule.end}
              </td>
              <td className="border-b border-[#e5e5e5] px-3 py-[0.6rem] text-[0.9rem]">
                {professional.days_off.map((d) => DAYS.find((x) => x.code === d)?.label).join(', ') || '—'}
              </td>
              <td className="border-b border-[#e5e5e5] px-3 py-[0.6rem] text-[0.9rem]">
                {professional.active ? 'Activo' : 'Inactivo'}
              </td>
              <td className="border-b border-[#e5e5e5] px-3 py-[0.6rem] text-[0.9rem]">
                <button
                  type="button"
                  className="mr-2 rounded-md border border-[#ccc] bg-white px-3 py-[0.4rem] text-[0.85rem]"
                  onClick={() => startEdit(professional)}
                >
                  Editar
                </button>
                <button
                  type="button"
                  className="mr-2 rounded-md border border-[#ccc] bg-white px-3 py-[0.4rem] text-[0.85rem]"
                  onClick={() => toggleActive(professional)}
                >
                  {professional.active ? 'Desactivar' : 'Activar'}
                </button>
                <button
                  type="button"
                  className="mr-2 rounded-md border border-[#ccc] bg-white px-3 py-[0.4rem] text-[0.85rem]"
                  onClick={() => handleDelete(professional.id)}
                >
                  Borrar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {editingId !== null && (
        <form className="max-w-[480px] rounded-[10px] border border-[#e5e5e5] bg-white p-6" onSubmit={handleSubmit}>
          <h2>{editingId === '__new__' ? 'Nuevo barbero' : 'Editar barbero'}</h2>
          <label className="mb-4 flex flex-col gap-1 text-[0.9rem]">
            Nombre
            <input
              type="text"
              required
              className="rounded-md border border-[#ccc] p-[0.6rem] text-base"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </label>

          <fieldset className="mb-4 rounded-lg border border-[#e5e5e5] p-4">
            <legend>Servicios que ofrece</legend>
            {tenant.services.map((service) => (
              <label key={service.id} className="mb-4 flex flex-row items-center gap-2 text-[0.9rem]">
                <input
                  type="checkbox"
                  className="w-auto p-0"
                  checked={form.service_ids.includes(service.id)}
                  onChange={() => toggleServiceId(service.id)}
                />
                {service.name}
              </label>
            ))}
          </fieldset>

          <label className="mb-4 flex flex-col gap-1 text-[0.9rem]">
            Hora de inicio
            <input
              type="time"
              className="rounded-md border border-[#ccc] p-[0.6rem] text-base"
              value={form.schedule.start}
              onChange={(e) => setForm({ ...form, schedule: { ...form.schedule, start: e.target.value } })}
            />
          </label>
          <label className="mb-4 flex flex-col gap-1 text-[0.9rem]">
            Hora de fin
            <input
              type="time"
              className="rounded-md border border-[#ccc] p-[0.6rem] text-base"
              value={form.schedule.end}
              onChange={(e) => setForm({ ...form, schedule: { ...form.schedule, end: e.target.value } })}
            />
          </label>
          <label className="mb-4 flex flex-col gap-1 text-[0.9rem]">
            Duración de bloque (min)
            <input
              type="number"
              min="5"
              className="rounded-md border border-[#ccc] p-[0.6rem] text-base"
              value={form.schedule.slot_minutes}
              onChange={(e) =>
                setForm({ ...form, schedule: { ...form.schedule, slot_minutes: Number(e.target.value) } })
              }
            />
          </label>

          <fieldset className="mb-4 rounded-lg border border-[#e5e5e5] p-4">
            <legend>Días de descanso</legend>
            {DAYS.map((day) => (
              <label key={day.code} className="mb-4 flex flex-row items-center gap-2 text-[0.9rem]">
                <input
                  type="checkbox"
                  className="w-auto p-0"
                  checked={form.days_off.includes(day.code)}
                  onChange={() => toggleDayOff(day.code)}
                />
                {day.label}
              </label>
            ))}
          </fieldset>

          <label className="mb-4 flex flex-row items-center gap-2 text-[0.9rem]">
            <input
              type="checkbox"
              className="w-auto p-0"
              checked={form.active}
              onChange={(e) => setForm({ ...form, active: e.target.checked })}
            />
            Activo (si se desmarca, desaparece del calendario de reservas)
          </label>

          <div className="mt-6 flex justify-between">
            <button
              type="button"
              className="border-0 bg-transparent p-0 text-secondary disabled:opacity-50"
              onClick={cancelEdit}
              disabled={saving}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="rounded-md border border-[#ccc] bg-white px-3 py-[0.4rem] text-[0.85rem] disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={saving}
            >
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}

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
      <div className="admin-page-header">
        <h1>Equipo / Barberos</h1>
        {editingId === null && (
          <button type="button" onClick={startCreate}>
            + Nuevo barbero
          </button>
        )}
      </div>

      {error && <p className="form-error">{error}</p>}

      <table className="crud-table">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Servicios</th>
            <th>Horario</th>
            <th>Descanso</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {tenant.professionals.map((professional) => (
            <tr key={professional.id}>
              <td>{professional.name}</td>
              <td>
                {professional.service_ids
                  .map((id) => tenant.services.find((s) => s.id === id)?.name ?? id)
                  .join(', ')}
              </td>
              <td>
                {professional.schedule.start}–{professional.schedule.end}
              </td>
              <td>{professional.days_off.map((d) => DAYS.find((x) => x.code === d)?.label).join(', ') || '—'}</td>
              <td>{professional.active ? 'Activo' : 'Inactivo'}</td>
              <td>
                <button type="button" onClick={() => startEdit(professional)}>
                  Editar
                </button>
                <button type="button" onClick={() => toggleActive(professional)}>
                  {professional.active ? 'Desactivar' : 'Activar'}
                </button>
                <button type="button" onClick={() => handleDelete(professional.id)}>
                  Borrar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {editingId !== null && (
        <form className="crud-form" onSubmit={handleSubmit}>
          <h2>{editingId === '__new__' ? 'Nuevo barbero' : 'Editar barbero'}</h2>
          <label>
            Nombre
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </label>

          <fieldset>
            <legend>Servicios que ofrece</legend>
            {tenant.services.map((service) => (
              <label key={service.id} className="checkbox-label">
                <input
                  type="checkbox"
                  checked={form.service_ids.includes(service.id)}
                  onChange={() => toggleServiceId(service.id)}
                />
                {service.name}
              </label>
            ))}
          </fieldset>

          <label>
            Hora de inicio
            <input
              type="time"
              value={form.schedule.start}
              onChange={(e) => setForm({ ...form, schedule: { ...form.schedule, start: e.target.value } })}
            />
          </label>
          <label>
            Hora de fin
            <input
              type="time"
              value={form.schedule.end}
              onChange={(e) => setForm({ ...form, schedule: { ...form.schedule, end: e.target.value } })}
            />
          </label>
          <label>
            Duración de bloque (min)
            <input
              type="number"
              min="5"
              value={form.schedule.slot_minutes}
              onChange={(e) =>
                setForm({ ...form, schedule: { ...form.schedule, slot_minutes: Number(e.target.value) } })
              }
            />
          </label>

          <fieldset>
            <legend>Días de descanso</legend>
            {DAYS.map((day) => (
              <label key={day.code} className="checkbox-label">
                <input
                  type="checkbox"
                  checked={form.days_off.includes(day.code)}
                  onChange={() => toggleDayOff(day.code)}
                />
                {day.label}
              </label>
            ))}
          </fieldset>

          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(e) => setForm({ ...form, active: e.target.checked })}
            />
            Activo (si se desmarca, desaparece del calendario de reservas)
          </label>

          <div className="wizard-actions">
            <button type="button" className="link-button" onClick={cancelEdit} disabled={saving}>
              Cancelar
            </button>
            <button type="submit" disabled={saving}>
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}

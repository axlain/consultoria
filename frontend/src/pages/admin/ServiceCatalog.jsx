import { useState } from 'react'
import { useTenant } from '../../context/TenantContext'
import { api } from '../../api/client'

const EMPTY_FORM = {
  name: '',
  duration_minutes: 30,
  price: 0,
  requires_tattoo_details: false,
  color: '#4c6ef5',
}

export function ServiceCatalog() {
  const { tenant, refreshTenant } = useTenant()
  const showTattooDetails = tenant.business.type === 'tattoo'
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
      requires_tattoo_details: service.requires_tattoo_details,
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

  return (
    <div>
      <div className="admin-page-header">
        <h1>Catálogo de servicios</h1>
        {editingId === null && (
          <button type="button" onClick={startCreate}>
            + Nuevo servicio
          </button>
        )}
      </div>

      {error && <p className="form-error">{error}</p>}

      <table className="crud-table">
        <thead>
          <tr>
            <th>Color</th>
            <th>Nombre</th>
            <th>Duración</th>
            <th>Precio</th>
            {showTattooDetails && <th>Requiere detalles de tatuaje</th>}
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {tenant.services.map((service) => (
            <tr key={service.id}>
              <td>
                <span className="color-swatch" style={{ backgroundColor: service.color }} />
              </td>
              <td>{service.name}</td>
              <td>{service.duration_minutes} min</td>
              <td>${service.price}</td>
              {showTattooDetails && <td>{service.requires_tattoo_details ? 'Sí' : 'No'}</td>}
              <td>
                <button type="button" onClick={() => startEdit(service)}>
                  Editar
                </button>
                <button type="button" onClick={() => handleDelete(service.id)}>
                  Borrar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {editingId !== null && (
        <form className="crud-form" onSubmit={handleSubmit}>
          <h2>{editingId === '__new__' ? 'Nuevo servicio' : 'Editar servicio'}</h2>
          <label>
            Nombre
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </label>
          <label>
            Duración (min)
            <input
              type="number"
              min="5"
              required
              value={form.duration_minutes}
              onChange={(e) => setForm({ ...form, duration_minutes: Number(e.target.value) })}
            />
          </label>
          <label>
            Precio
            <input
              type="number"
              min="0"
              required
              value={form.price}
              onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
            />
          </label>
          {showTattooDetails && (
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={form.requires_tattoo_details}
                onChange={(e) => setForm({ ...form, requires_tattoo_details: e.target.checked })}
              />
              Requiere detalles de tatuaje
            </label>
          )}
          <label>
            Color
            <input type="color" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} />
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

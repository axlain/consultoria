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

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1>Catálogo de servicios</h1>
        {editingId === null && (
          <button
            type="button"
            className="rounded-md border border-[#ccc] bg-white px-3 py-[0.4rem] text-[0.85rem]"
            onClick={startCreate}
          >
            + Nuevo servicio
          </button>
        )}
      </div>

      {error && <p className="text-[#c0392b]">{error}</p>}

      {/* Mobile: one card per service instead of a table that would overflow. */}
      <div className="mb-6 flex flex-col gap-3 md:hidden">
        {tenant.services.map((service) => (
          <div key={service.id} className="rounded-xl border border-[#e5e5e5] bg-white p-4">
            <div className="mb-3 flex items-center gap-2">
              <span
                className="inline-block h-3 w-3 shrink-0 rounded-full"
                style={{ backgroundColor: service.color }}
              />
              <span className="font-semibold">{service.name}</span>
            </div>
            <dl className="mb-3 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-[0.9rem]">
              <dt className="text-[#888]">Duración</dt>
              <dd className="m-0">{service.duration_minutes} min</dd>
              <dt className="text-[#888]">Precio</dt>
              <dd className="m-0">${service.price}</dd>
            </dl>
            <div className="flex gap-2">
              <button
                type="button"
                className="flex-1 rounded-md border border-[#ccc] bg-white px-3 py-[0.5rem] text-[0.85rem]"
                onClick={() => startEdit(service)}
              >
                Editar
              </button>
              <button
                type="button"
                className="flex-1 rounded-md border border-[#ccc] bg-white px-3 py-[0.5rem] text-[0.85rem]"
                onClick={() => handleDelete(service.id)}
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
            <th className="border-b border-[#e5e5e5] px-3 py-[0.6rem] text-left text-[0.9rem]">Color</th>
            <th className="border-b border-[#e5e5e5] px-3 py-[0.6rem] text-left text-[0.9rem]">Nombre</th>
            <th className="border-b border-[#e5e5e5] px-3 py-[0.6rem] text-left text-[0.9rem]">Duración</th>
            <th className="border-b border-[#e5e5e5] px-3 py-[0.6rem] text-left text-[0.9rem]">Precio</th>
            <th className="border-b border-[#e5e5e5] px-3 py-[0.6rem] text-left text-[0.9rem]">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {tenant.services.map((service) => (
            <tr key={service.id}>
              <td className="border-b border-[#e5e5e5] px-3 py-[0.6rem] text-[0.9rem]">
                <span className="inline-block h-[18px] w-[18px] rounded" style={{ backgroundColor: service.color }} />
              </td>
              <td className="border-b border-[#e5e5e5] px-3 py-[0.6rem] text-[0.9rem]">{service.name}</td>
              <td className="border-b border-[#e5e5e5] px-3 py-[0.6rem] text-[0.9rem]">
                {service.duration_minutes} min
              </td>
              <td className="border-b border-[#e5e5e5] px-3 py-[0.6rem] text-[0.9rem]">${service.price}</td>
              <td className="border-b border-[#e5e5e5] px-3 py-[0.6rem] text-[0.9rem]">
                <button
                  type="button"
                  className="mr-2 rounded-md border border-[#ccc] bg-white px-3 py-[0.4rem] text-[0.85rem]"
                  onClick={() => startEdit(service)}
                >
                  Editar
                </button>
                <button
                  type="button"
                  className="mr-2 rounded-md border border-[#ccc] bg-white px-3 py-[0.4rem] text-[0.85rem]"
                  onClick={() => handleDelete(service.id)}
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
          <h2>{editingId === '__new__' ? 'Nuevo servicio' : 'Editar servicio'}</h2>
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
          <label className="mb-4 flex flex-col gap-1 text-[0.9rem]">
            Duración (min)
            <input
              type="number"
              min="5"
              required
              className="rounded-md border border-[#ccc] p-[0.6rem] text-base"
              value={form.duration_minutes}
              onChange={(e) => setForm({ ...form, duration_minutes: Number(e.target.value) })}
            />
          </label>
          <label className="mb-4 flex flex-col gap-1 text-[0.9rem]">
            Precio
            <input
              type="number"
              min="0"
              required
              className="rounded-md border border-[#ccc] p-[0.6rem] text-base"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
            />
          </label>
          <label className="mb-4 flex flex-col gap-1 text-[0.9rem]">
            Color
            <input
              type="color"
              className="h-10 w-16 rounded-md border border-[#ccc] p-[0.2rem]"
              value={form.color}
              onChange={(e) => setForm({ ...form, color: e.target.value })}
            />
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

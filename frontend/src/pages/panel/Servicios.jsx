import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { api } from '../../api/client'

const EMPTY_FORM = {
  name: '',
  duration_minutes: 30,
  price: 0,
  color: '#4c6ef5',
  professional_ids: [],
}

// Same CRUD as the legacy /demo/:slug/admin/servicios screen, ported into the
// role-based panel: fetches the tenant directly (like Equipo.jsx) instead of
// through TenantContext, since /panel/* isn't wrapped in TenantGate.
export function Servicios() {
  const { user } = useAuth()
  const slug = user?.business_id || 'levisalon-keratinas'

  const [tenant, setTenant] = useState(null)
  const [loadError, setLoadError] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [error, setError] = useState(null)
  const [saving, setSaving] = useState(false)

  function load() {
    setLoadError('')
    api.getTenant(slug).then(setTenant).catch((err) => setLoadError(err.message))
  }

  useEffect(() => { load() }, [slug])

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
      professional_ids: tenant.professionals.filter((p) => p.service_ids.includes(service.id)).map((p) => p.id),
    })
    setError(null)
  }

  function toggleProfessionalId(professionalId) {
    setForm((prev) => ({
      ...prev,
      professional_ids: prev.professional_ids.includes(professionalId)
        ? prev.professional_ids.filter((id) => id !== professionalId)
        : [...prev.professional_ids, professionalId],
    }))
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
        await api.createService(slug, form)
      } else {
        await api.updateService(slug, editingId, form)
      }
      load()
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
      await api.deleteService(slug, serviceId)
      load()
    } catch (err) {
      setError(err.message)
    }
  }

  function professionalNamesFor(serviceId) {
    const names = tenant.professionals.filter((p) => p.service_ids.includes(serviceId)).map((p) => p.name)
    return names.length > 0 ? names.join(', ') : '—'
  }

  const inputClass = 'rounded-xl border border-line bg-paper px-3 py-2.5 text-sm text-ink outline-none focus:border-accent transition-colors w-full'
  const labelClass = 'mb-4 flex flex-col gap-1.5 text-xs font-bold uppercase tracking-wider text-muted'
  const btnSecondary = 'rounded-xl border border-line px-3 py-2 text-sm font-semibold text-muted hover:border-accent/40 hover:text-ink transition-colors'

  if (loadError) {
    return <p className="text-sm text-red-400">{loadError}</p>
  }

  if (!tenant) {
    return (
      <div className="flex flex-col gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-20 animate-pulse rounded-xl bg-surface" />
        ))}
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-ink">Catálogo de servicios</h1>
        {editingId === null && (
          <button
            type="button"
            className="rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-[#0C0B09] hover:bg-accent-light transition-colors"
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
          <div key={service.id} className="rounded-xl border border-line bg-surface p-4">
            <div className="mb-3 flex items-center gap-2">
              <span
                className="inline-block h-3 w-3 shrink-0 rounded-full"
                style={{ backgroundColor: service.color }}
              />
              <span className="font-semibold text-ink">{service.name}</span>
            </div>
            <dl className="mb-3 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-[0.9rem]">
              <dt className="text-muted">Duración</dt>
              <dd className="m-0 text-ink/80">{service.duration_minutes} min</dd>
              <dt className="text-muted">Precio</dt>
              <dd className="m-0 text-accent font-semibold">${service.price}</dd>
              <dt className="text-muted">Profesionales</dt>
              <dd className="m-0 text-ink/80">{professionalNamesFor(service.id)}</dd>
            </dl>
            <div className="flex gap-2">
              <button type="button" className={`flex-1 ${btnSecondary}`} onClick={() => startEdit(service)}>Editar</button>
              <button type="button" className="flex-1 rounded-xl border border-red-500/20 px-3 py-2 text-sm font-semibold text-red-400 hover:bg-red-500/10 transition-colors" onClick={() => handleDelete(service.id)}>Borrar</button>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop: table. */}
      <div className="mb-6 hidden overflow-x-auto rounded-xl border border-line md:block">
        <table className="w-full border-collapse">
          <thead className="border-b border-line bg-surface-alt">
            <tr>
              {['Color', 'Nombre', 'Duración', 'Precio', 'Profesionales', 'Acciones'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {tenant.services.map((service) => (
              <tr key={service.id} className="hover:bg-surface transition-colors">
                <td className="px-4 py-3">
                  <span className="inline-block h-[18px] w-[18px] rounded-md" style={{ backgroundColor: service.color }} />
                </td>
                <td className="px-4 py-3 font-medium text-ink">{service.name}</td>
                <td className="px-4 py-3 text-muted">{service.duration_minutes} min</td>
                <td className="px-4 py-3 font-semibold text-accent">${service.price}</td>
                <td className="px-4 py-3 text-sm text-muted">{professionalNamesFor(service.id)}</td>
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
        <form className="max-w-[480px] rounded-2xl border border-line bg-surface p-6" onSubmit={handleSubmit}>
          <h2 className="mb-5 text-lg font-bold text-ink">{editingId === '__new__' ? 'Nuevo servicio' : 'Editar servicio'}</h2>
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
            <input type="color" className="h-10 w-16 rounded-lg border border-line bg-paper p-[0.2rem] cursor-pointer" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} />
          </label>

          <fieldset className="mb-4 rounded-xl border border-line p-4">
            <legend className="px-2 text-xs font-bold uppercase tracking-wider text-muted">Profesionales que lo ofrecen</legend>
            {tenant.professionals.length === 0 && (
              <p className="text-sm text-muted">Aún no hay profesionales en el equipo.</p>
            )}
            {tenant.professionals.map((professional) => (
              <label key={professional.id} className="mb-3 flex flex-row items-center gap-2 text-sm text-ink cursor-pointer">
                <input
                  type="checkbox"
                  className="accent-accent w-auto p-0"
                  checked={form.professional_ids.includes(professional.id)}
                  onChange={() => toggleProfessionalId(professional.id)}
                />
                {professional.name}
              </label>
            ))}
          </fieldset>

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

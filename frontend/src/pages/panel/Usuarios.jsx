import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'

const ROLE_LABEL = { client: 'Cliente', employee: 'Empleado', host: 'Host', admin: 'Admin' }
const ROLE_COLOR = {
  client:   'bg-blue-500/15 text-blue-400 border border-blue-500/20',
  employee: 'bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/20',
  host:     'bg-purple-500/15 text-purple-400 border border-purple-500/20',
  admin:    'bg-accent/15 text-accent border border-accent/20',
}

const inputClass = 'rounded-xl border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-accent transition-colors'

const ROLE_FILTERS = [
  { value: 'all', label: 'Ver todos' },
  { value: 'client', label: 'Clientes' },
  { value: 'employee', label: 'Empleados' },
  { value: 'admin', label: 'Administradores' },
  { value: 'host', label: 'Host' },
]

export function Usuarios() {
  const { token, user: me } = useAuth()
  const [users, setUsers] = useState([])
  const [roleFilter, setRoleFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [invite, setInvite] = useState({ open: false, email: '', name: '', role: 'employee' })
  const [inviteLoading, setInviteLoading] = useState(false)
  const [inviteResult, setInviteResult] = useState(null)

  const filteredUsers = roleFilter === 'all' ? users : users.filter(u => u.role === roleFilter)

  async function apiFetch(path, opts = {}) {
    const res = await fetch(path, {
      ...opts,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...(opts.headers ?? {}) },
    })
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).detail ?? 'Error')
    return res.json()
  }

  async function load() {
    setLoading(true)
    try { setUsers(await apiFetch('/api/admin/users')) }
    catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  async function changeRole(userId, role) {
    try {
      const updated = await apiFetch(`/api/admin/users/${userId}/role`, {
        method: 'PATCH',
        body: JSON.stringify({ role }),
      })
      setUsers(u => u.map(x => x.id === updated.id ? { ...x, role: updated.role } : x))
    } catch (e) { alert(e.message) }
  }

  async function deactivate(userId) {
    if (!confirm('¿Desactivar este usuario?')) return
    try {
      await apiFetch(`/api/admin/users/${userId}/deactivate`, { method: 'PATCH' })
      setUsers(u => u.filter(x => x.id !== userId))
    } catch (e) { alert(e.message) }
  }

  async function sendInvite(e) {
    e.preventDefault()
    setInviteLoading(true)
    setInviteResult(null)
    try {
      const result = await apiFetch('/api/auth/invite', {
        method: 'POST',
        body: JSON.stringify({ email: invite.email, name: invite.name, role: invite.role, business_id: me.business_id }),
      })
      setInviteResult(result)
      await load()
    } catch (e) { alert(e.message) }
    finally { setInviteLoading(false) }
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-ink">Usuarios</h1>
        <button
          onClick={() => { setInvite(i => ({ ...i, open: true })); setInviteResult(null) }}
          className="rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-[#0C0B09] hover:bg-accent-light transition-colors"
        >
          + Invitar usuario
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</div>
      )}

      <div className="mb-4 flex flex-wrap gap-2" role="tablist" aria-label="Filtrar por rol">
        {ROLE_FILTERS.map(f => (
          <button
            key={f.value}
            type="button"
            role="tab"
            aria-selected={roleFilter === f.value}
            onClick={() => setRoleFilter(f.value)}
            className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
              roleFilter === f.value
                ? 'bg-accent text-[#0C0B09]'
                : 'border border-line bg-surface text-muted hover:border-accent/40 hover:text-ink'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-sm text-muted">Cargando…</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-line">
          <table className="min-w-full text-sm">
            <thead className="border-b border-line bg-surface-alt text-xs text-muted">
              <tr>
                {['Nombre', 'Email', 'Rol', 'Acciones'].map(h => (
                  <th key={h} className="px-4 py-3 text-left font-semibold uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-sm text-muted">
                    No hay usuarios con este filtro.
                  </td>
                </tr>
              )}
              {filteredUsers.map(u => (
                <tr key={u.id} className="hover:bg-surface transition-colors">
                  <td className="px-4 py-3 font-medium text-ink">{u.name}</td>
                  <td className="px-4 py-3 text-muted">{u.email}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${ROLE_COLOR[u.role] ?? 'bg-line text-muted'}`}>
                      {ROLE_LABEL[u.role]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {u.id !== me.id && (
                      <div className="flex items-center gap-3">
                        <select
                          value={u.role}
                          onChange={e => changeRole(u.id, e.target.value)}
                          className="rounded-lg border border-line bg-surface-alt px-2 py-1 text-xs text-ink outline-none focus:border-accent"
                        >
                          {Object.entries(ROLE_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                        </select>
                        <button
                          onClick={() => deactivate(u.id)}
                          className="text-xs text-red-400 hover:text-red-300 transition-colors"
                        >
                          Desactivar
                        </button>
                      </div>
                    )}
                    {u.id === me.id && <span className="text-xs text-muted">(tú)</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Invite modal */}
      {invite.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setInvite(i => ({ ...i, open: false }))}>
          <div className="w-full max-w-sm rounded-2xl border border-line bg-surface-alt p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-bold text-ink">Invitar usuario</h2>
              <button onClick={() => setInvite(i => ({ ...i, open: false }))} className="text-muted hover:text-ink text-xl leading-none transition-colors">✕</button>
            </div>

            {inviteResult ? (
              <div>
                <div className="mb-4 rounded-xl border border-[#10B981]/20 bg-[#10B981]/10 p-3 text-sm text-[#10B981]">
                  {inviteResult.temp_password ? (
                    <>
                      Usuario creado. Contraseña temporal: <strong>{inviteResult.temp_password}</strong>
                      <br /><span className="text-xs opacity-80">Compártela de forma segura y pídele que la cambie.</span>
                    </>
                  ) : (
                    'Invitación enviada. Le llegará un correo para crear su contraseña y activar la cuenta.'
                  )}
                </div>
                <button
                  onClick={() => { setInvite(i => ({ ...i, open: false, email: '', name: '' })); setInviteResult(null) }}
                  className="w-full rounded-xl bg-accent py-2.5 text-sm font-semibold text-[#0C0B09] hover:bg-accent-light transition-colors"
                >
                  Cerrar
                </button>
              </div>
            ) : (
              <form onSubmit={sendInvite} className="flex flex-col gap-3">
                <label className="flex flex-col gap-1.5 text-xs font-bold uppercase tracking-wider text-muted">
                  Nombre
                  <input required value={invite.name} onChange={e => setInvite(i => ({ ...i, name: e.target.value }))} className={inputClass} />
                </label>
                <label className="flex flex-col gap-1.5 text-xs font-bold uppercase tracking-wider text-muted">
                  Email
                  <input type="email" required value={invite.email} onChange={e => setInvite(i => ({ ...i, email: e.target.value }))} className={inputClass} />
                </label>
                <label className="flex flex-col gap-1.5 text-xs font-bold uppercase tracking-wider text-muted">
                  Rol
                  <select value={invite.role} onChange={e => setInvite(i => ({ ...i, role: e.target.value }))} className={inputClass}>
                    <option value="employee">Empleado</option>
                    <option value="host">Host</option>
                    <option value="admin">Admin</option>
                  </select>
                </label>
                <button
                  type="submit"
                  disabled={inviteLoading}
                  className="mt-2 rounded-xl bg-accent py-2.5 text-sm font-semibold text-[#0C0B09] hover:bg-accent-light transition-colors disabled:opacity-50"
                >
                  {inviteLoading ? 'Creando…' : 'Crear e invitar'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

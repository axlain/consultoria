import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'

const ROLE_LABEL = { client: 'Cliente', employee: 'Empleado', host: 'Host', admin: 'Admin' }
const ROLE_COLOR = {
  client: 'bg-blue-100 text-blue-800',
  employee: 'bg-green-100 text-green-800',
  host: 'bg-purple-100 text-purple-800',
  admin: 'bg-orange-100 text-orange-800',
}

export function Usuarios() {
  const { token, user: me } = useAuth()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [invite, setInvite] = useState({ open: false, email: '', name: '', role: 'employee' })
  const [inviteLoading, setInviteLoading] = useState(false)
  const [inviteResult, setInviteResult] = useState(null)

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
        <h1 className="text-2xl font-bold text-[#1c1c1e]">Usuarios</h1>
        <button
          onClick={() => { setInvite(i => ({ ...i, open: true })); setInviteResult(null) }}
          className="rounded-lg bg-[#c9a24b] px-4 py-2 text-sm font-semibold text-white"
        >
          + Invitar usuario
        </button>
      </div>

      {error && <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      {loading ? (
        <p className="text-sm text-[#6e6e73]">Cargando…</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-[#d1d1d6]">
          <table className="min-w-full text-sm">
            <thead className="bg-[#f5f5f5] text-xs text-[#6e6e73]">
              <tr>
                {['Nombre', 'Email', 'Rol', 'Acciones'].map(h => (
                  <th key={h} className="px-4 py-3 text-left font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0f0f0]">
              {users.map(u => (
                <tr key={u.id} className="hover:bg-[#fafafa]">
                  <td className="px-4 py-3 font-medium text-[#1c1c1e]">{u.name}</td>
                  <td className="px-4 py-3 text-[#6e6e73]">{u.email}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${ROLE_COLOR[u.role]}`}>
                      {ROLE_LABEL[u.role]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {u.id !== me.id && (
                      <div className="flex items-center gap-3">
                        <select
                          value={u.role}
                          onChange={e => changeRole(u.id, e.target.value)}
                          className="rounded border border-[#d1d1d6] px-2 py-1 text-xs"
                        >
                          {Object.entries(ROLE_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                        </select>
                        <button
                          onClick={() => deactivate(u.id)}
                          className="text-xs text-red-500 hover:underline"
                        >
                          Desactivar
                        </button>
                      </div>
                    )}
                    {u.id === me.id && <span className="text-xs text-[#6e6e73]">(tú)</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Invite modal */}
      {invite.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-bold text-[#1c1c1e]">Invitar usuario</h2>
              <button onClick={() => setInvite(i => ({ ...i, open: false }))} className="text-[#6e6e73]">✕</button>
            </div>

            {inviteResult ? (
              <div>
                <div className="mb-4 rounded-lg bg-green-50 p-3 text-sm text-green-800">
                  Usuario creado. Contraseña temporal: <strong>{inviteResult.temp_password}</strong>
                  <br /><span className="text-xs">Compártela de forma segura y pídele que la cambie.</span>
                </div>
                <button
                  onClick={() => { setInvite(i => ({ ...i, open: false, email: '', name: '' })); setInviteResult(null) }}
                  className="w-full rounded-lg bg-[#c9a24b] py-2 text-sm font-semibold text-white"
                >
                  Cerrar
                </button>
              </div>
            ) : (
              <form onSubmit={sendInvite} className="flex flex-col gap-3">
                <label className="flex flex-col gap-1 text-sm font-medium text-[#3a3a3c]">
                  Nombre
                  <input
                    required value={invite.name}
                    onChange={e => setInvite(i => ({ ...i, name: e.target.value }))}
                    className="rounded-lg border border-[#d1d1d6] px-3 py-2 text-sm outline-none focus:border-[#c9a24b]"
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm font-medium text-[#3a3a3c]">
                  Email
                  <input
                    type="email" required value={invite.email}
                    onChange={e => setInvite(i => ({ ...i, email: e.target.value }))}
                    className="rounded-lg border border-[#d1d1d6] px-3 py-2 text-sm outline-none focus:border-[#c9a24b]"
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm font-medium text-[#3a3a3c]">
                  Rol
                  <select
                    value={invite.role}
                    onChange={e => setInvite(i => ({ ...i, role: e.target.value }))}
                    className="rounded-lg border border-[#d1d1d6] px-3 py-2 text-sm outline-none focus:border-[#c9a24b]"
                  >
                    <option value="employee">Empleado</option>
                    <option value="host">Host</option>
                    <option value="admin">Admin</option>
                  </select>
                </label>
                <button
                  type="submit"
                  disabled={inviteLoading}
                  className="mt-2 rounded-lg bg-[#c9a24b] py-2 text-sm font-semibold text-white disabled:opacity-50"
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

import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'

const ROLE_LABEL = { client: 'Cliente', employee: 'Empleado', host: 'Host', admin: 'Admin' }
const ROLE_COLOR = {
  client:   'bg-blue-500/15 text-blue-400 border border-blue-500/20',
  employee: 'bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/20',
  host:     'bg-purple-500/15 text-purple-400 border border-purple-500/20',
  admin:    'bg-[#C8973E]/15 text-[#C8973E] border border-[#C8973E]/20',
}

const inputClass = 'rounded-xl border border-[#2A2520] bg-[#1E1B15] px-3 py-2 text-sm text-[#F2EBE0] outline-none focus:border-[#C8973E] transition-colors'

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
        <h1 className="text-2xl font-bold text-[#F2EBE0]">Usuarios</h1>
        <button
          onClick={() => { setInvite(i => ({ ...i, open: true })); setInviteResult(null) }}
          className="rounded-xl bg-[#C8973E] px-4 py-2 text-sm font-semibold text-[#0C0B09] hover:bg-[#E8B86D] transition-colors"
        >
          + Invitar usuario
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</div>
      )}

      {loading ? (
        <p className="text-sm text-[#7A7065]">Cargando…</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-[#2A2520]">
          <table className="min-w-full text-sm">
            <thead className="border-b border-[#2A2520] bg-[#161410] text-xs text-[#7A7065]">
              <tr>
                {['Nombre', 'Email', 'Rol', 'Acciones'].map(h => (
                  <th key={h} className="px-4 py-3 text-left font-semibold uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2A2520]">
              {users.map(u => (
                <tr key={u.id} className="hover:bg-[#1E1B15] transition-colors">
                  <td className="px-4 py-3 font-medium text-[#F2EBE0]">{u.name}</td>
                  <td className="px-4 py-3 text-[#7A7065]">{u.email}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${ROLE_COLOR[u.role] ?? 'bg-[#2A2520] text-[#7A7065]'}`}>
                      {ROLE_LABEL[u.role]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {u.id !== me.id && (
                      <div className="flex items-center gap-3">
                        <select
                          value={u.role}
                          onChange={e => changeRole(u.id, e.target.value)}
                          className="rounded-lg border border-[#2A2520] bg-[#161410] px-2 py-1 text-xs text-[#F2EBE0] outline-none focus:border-[#C8973E]"
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
                    {u.id === me.id && <span className="text-xs text-[#7A7065]">(tú)</span>}
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
          <div className="w-full max-w-sm rounded-2xl border border-[#2A2520] bg-[#161410] p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-bold text-[#F2EBE0]">Invitar usuario</h2>
              <button onClick={() => setInvite(i => ({ ...i, open: false }))} className="text-[#7A7065] hover:text-[#F2EBE0] text-xl leading-none transition-colors">✕</button>
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
                  className="w-full rounded-xl bg-[#C8973E] py-2.5 text-sm font-semibold text-[#0C0B09] hover:bg-[#E8B86D] transition-colors"
                >
                  Cerrar
                </button>
              </div>
            ) : (
              <form onSubmit={sendInvite} className="flex flex-col gap-3">
                <label className="flex flex-col gap-1.5 text-xs font-bold uppercase tracking-wider text-[#7A7065]">
                  Nombre
                  <input required value={invite.name} onChange={e => setInvite(i => ({ ...i, name: e.target.value }))} className={inputClass} />
                </label>
                <label className="flex flex-col gap-1.5 text-xs font-bold uppercase tracking-wider text-[#7A7065]">
                  Email
                  <input type="email" required value={invite.email} onChange={e => setInvite(i => ({ ...i, email: e.target.value }))} className={inputClass} />
                </label>
                <label className="flex flex-col gap-1.5 text-xs font-bold uppercase tracking-wider text-[#7A7065]">
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
                  className="mt-2 rounded-xl bg-[#C8973E] py-2.5 text-sm font-semibold text-[#0C0B09] hover:bg-[#E8B86D] transition-colors disabled:opacity-50"
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

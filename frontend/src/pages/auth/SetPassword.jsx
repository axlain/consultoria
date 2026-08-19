import { useEffect, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { roleHome } from '../../components/ProtectedRoute'
import { AuthShell } from '../../components/AuthShell'

// Landing page for Supabase invite-by-email links. Supabase-js parses the
// invite tokens out of the URL on load and establishes a session for the
// invited user; this page lets them pick a password for that account, then
// hands off to AuthContext to mint the app's own token.
export function SetPassword() {
  const { user, loginWithSupabaseToken } = useAuth()
  const navigate = useNavigate()
  const [ready, setReady] = useState(false)
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!supabase) {
      setError('Login social no configurado (faltan variables VITE_SUPABASE_*).')
      return
    }
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true)
      else setError('El link de invitación no es válido o ya expiró. Pide que te reenvíen la invitación.')
    })
  }, [])

  if (user) return <Navigate to={user.role === 'client' ? '/demo/barberia' : roleHome(user.role)} replace />

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (password.length < 6) { setError('La contraseña debe tener al menos 6 caracteres'); return }
    if (password !== confirm) { setError('Las contraseñas no coinciden'); return }

    setLoading(true)
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password })
      if (updateError) throw updateError

      const { data } = await supabase.auth.getSession()
      const u = await loginWithSupabaseToken(data.session.access_token)
      navigate(u.role === 'client' ? '/demo/barberia' : roleHome(u.role), { replace: true })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      <AuthShell showMenu={false}>
        <h1 className="mb-6 text-2xl font-bold text-[#1c1c1e]">Crea tu contraseña</h1>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        {ready && (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <label className="flex flex-col gap-1 text-sm font-medium text-[#3a3a3c]">
              Contraseña
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="rounded-lg border border-[#d1d1d6] px-3 py-2 text-sm outline-none focus:border-[#c9a24b] focus:ring-1 focus:ring-[#c9a24b]"
                autoComplete="new-password"
              />
            </label>

            <label className="flex flex-col gap-1 text-sm font-medium text-[#3a3a3c]">
              Confirmar contraseña
              <input
                type="password"
                required
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                className="rounded-lg border border-[#d1d1d6] px-3 py-2 text-sm outline-none focus:border-[#c9a24b] focus:ring-1 focus:ring-[#c9a24b]"
                autoComplete="new-password"
              />
            </label>

            <button
              type="submit"
              disabled={loading}
              className="mt-1 rounded-lg bg-[#c9a24b] py-2.5 text-sm font-semibold text-white transition-opacity disabled:opacity-50"
            >
              {loading ? 'Guardando…' : 'Guardar y entrar'}
            </button>
          </form>
        )}
      </AuthShell>
    </div>
  )
}

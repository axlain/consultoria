import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { roleHome } from '../../components/ProtectedRoute'

export function Login() {
  const { login, user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from?.pathname ?? null

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (user) return <Navigate to={from ?? roleHome(user.role)} replace />

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const u = await login(email, password)
      navigate(from ?? roleHome(u.role), { replace: true })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f5f5f5] p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-md">
        <h1 className="mb-6 text-2xl font-bold text-[#1c1c1e]">Iniciar sesión</h1>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1 text-sm font-medium text-[#3a3a3c]">
            Email
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="rounded-lg border border-[#d1d1d6] px-3 py-2 text-sm outline-none focus:border-[#c9a24b] focus:ring-1 focus:ring-[#c9a24b]"
              placeholder="tu@email.com"
              autoComplete="email"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm font-medium text-[#3a3a3c]">
            Contraseña
            <input
              type="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="rounded-lg border border-[#d1d1d6] px-3 py-2 text-sm outline-none focus:border-[#c9a24b] focus:ring-1 focus:ring-[#c9a24b]"
              autoComplete="current-password"
            />
          </label>

          <button
            type="submit"
            disabled={loading}
            className="mt-2 rounded-lg bg-[#c9a24b] py-2.5 text-sm font-semibold text-white transition-opacity disabled:opacity-50"
          >
            {loading ? 'Entrando…' : 'Entrar'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-[#6e6e73]">
          ¿No tienes cuenta?{' '}
          <Link to="/registro" className="font-medium text-[#c9a24b] hover:underline">
            Regístrate
          </Link>
        </p>

        <div className="mt-6 rounded-lg bg-[#f5f5f5] p-3 text-xs text-[#6e6e73]">
          <p className="font-semibold mb-1">Usuarios de prueba:</p>
          <p>admin@barberia.com / admin123</p>
          <p>host@barberia.com / host123</p>
          <p>empleado@barberia.com / empleado123</p>
          <p>cliente@barberia.com / cliente123</p>
        </div>
      </div>
    </div>
  )
}

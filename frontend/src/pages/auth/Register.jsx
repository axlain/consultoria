import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { roleHome } from '../../components/ProtectedRoute'
import { AuthShell } from '../../components/AuthShell'

export function Register() {
  const { register, user } = useAuth()
  const navigate = useNavigate()

  const [nombre, setNombre] = useState('')
  const [apellidoPaterno, setApellidoPaterno] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (user) return <Navigate to={roleHome(user.role)} replace />

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (password.length < 6) { setError('La contraseña debe tener al menos 6 caracteres'); return }
    setLoading(true)
    try {
      const u = await register(email, password, `${nombre.trim()} ${apellidoPaterno.trim()}`.trim())
      navigate(roleHome(u.role), { replace: true })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      <AuthShell showMenu={false}>
        <h1 className="mb-6 text-2xl font-bold text-[#1c1c1e]">Crear cuenta</h1>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1 text-sm font-medium text-[#3a3a3c]">
            Nombre
            <input
              type="text"
              required
              value={nombre}
              onChange={e => setNombre(e.target.value)}
              className="rounded-lg border border-[#d1d1d6] px-3 py-2 text-sm outline-none focus:border-[#c9a24b] focus:ring-1 focus:ring-[#c9a24b]"
              placeholder="Escribe tu nombre..."
              autoComplete="given-name"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm font-medium text-[#3a3a3c]">
            Apellido paterno
            <input
              type="text"
              required
              value={apellidoPaterno}
              onChange={e => setApellidoPaterno(e.target.value)}
              className="rounded-lg border border-[#d1d1d6] px-3 py-2 text-sm outline-none focus:border-[#c9a24b] focus:ring-1 focus:ring-[#c9a24b]"
              placeholder="Escribe tu apellido paterno..."
              autoComplete="family-name"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm font-medium text-[#3a3a3c]">
            Email
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="rounded-lg border border-[#d1d1d6] px-3 py-2 text-sm outline-none focus:border-[#c9a24b] focus:ring-1 focus:ring-[#c9a24b]"
              placeholder="nombre@dominio.com"
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
              autoComplete="new-password"
              placeholder="Mínimo 6 caracteres"
            />
          </label>

          <button
            type="submit"
            disabled={loading}
            className="mt-2 rounded-lg bg-[#c9a24b] py-2.5 text-sm font-semibold text-white transition-opacity disabled:opacity-50"
          >
            {loading ? 'Creando cuenta…' : 'Crear cuenta'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-[#6e6e73]">
          ¿Ya tienes cuenta?{' '}
          <Link to="/login" className="font-medium text-[#c9a24b] hover:underline">
            Inicia sesión
          </Link>
        </p>
      </AuthShell>
    </div>
  )
}

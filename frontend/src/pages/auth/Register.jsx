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

  const inputClass = 'rounded-xl border border-line bg-surface px-3 py-2.5 text-sm text-ink outline-none focus:border-accent focus:ring-1 focus:ring-accent/20 transition-colors'
  const labelClass = 'flex flex-col gap-1 text-sm font-medium text-muted'

  return (
    <div className="min-h-screen bg-paper">
      <AuthShell showMenu={false}>
        <h1 className="mb-6 text-2xl font-bold text-ink">Crear cuenta</h1>

        {error && (
          <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <label className={labelClass}>
            Nombre
            <input
              type="text"
              required
              value={nombre}
              onChange={e => setNombre(e.target.value)}
              className={inputClass}
              placeholder="Escribe tu nombre..."
              autoComplete="given-name"
            />
          </label>

          <label className={labelClass}>
            Apellido paterno
            <input
              type="text"
              required
              value={apellidoPaterno}
              onChange={e => setApellidoPaterno(e.target.value)}
              className={inputClass}
              placeholder="Escribe tu apellido paterno..."
              autoComplete="family-name"
            />
          </label>

          <label className={labelClass}>
            Email
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              className={inputClass}
              placeholder="nombre@dominio.com"
              autoComplete="email"
            />
          </label>

          <label className={labelClass}>
            Contraseña
            <input
              type="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              className={inputClass}
              autoComplete="new-password"
              placeholder="Mínimo 6 caracteres"
            />
          </label>

          <button
            type="submit"
            disabled={loading}
            className="mt-2 rounded-xl bg-accent py-2.5 text-sm font-semibold text-[#0C0B09] hover:bg-accent-light transition-colors disabled:opacity-50"
          >
            {loading ? 'Creando cuenta…' : 'Crear cuenta'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-muted">
          ¿Ya tienes cuenta?{' '}
          <Link to="/login" className="font-medium text-accent hover:underline">
            Inicia sesión
          </Link>
        </p>
      </AuthShell>
    </div>
  )
}

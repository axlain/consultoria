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

  const inputClass = 'rounded-xl border border-[#2A2520] bg-[#1E1B15] px-3 py-2.5 text-sm text-[#F2EBE0] outline-none focus:border-[#C8973E] focus:ring-1 focus:ring-[#C8973E]/20 transition-colors'
  const labelClass = 'flex flex-col gap-1 text-sm font-medium text-[#7A7065]'

  return (
    <div className="min-h-screen bg-[#0C0B09]">
      <AuthShell showMenu={false}>
        <h1 className="mb-6 text-2xl font-bold text-[#F2EBE0]">Crear cuenta</h1>

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
            className="mt-2 rounded-xl bg-[#C8973E] py-2.5 text-sm font-semibold text-[#0C0B09] hover:bg-[#E8B86D] transition-colors disabled:opacity-50"
          >
            {loading ? 'Creando cuenta…' : 'Crear cuenta'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-[#7A7065]">
          ¿Ya tienes cuenta?{' '}
          <Link to="/login" className="font-medium text-[#C8973E] hover:underline">
            Inicia sesión
          </Link>
        </p>
      </AuthShell>
    </div>
  )
}

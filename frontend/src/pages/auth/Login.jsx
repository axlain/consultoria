import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { roleHome } from '../../components/ProtectedRoute'
import { AuthShell } from '../../components/AuthShell'

const DEMO_USERS = [
  { email: 'admin@barberia.com', password: 'admin123', role: 'Admin' },
  { email: 'host@barberia.com', password: 'host123', role: 'Host' },
  { email: 'empleado@barberia.com', password: 'empleado123', role: 'Empleado' },
  { email: 'cliente@barberia.com', password: 'cliente123', role: 'Cliente' },
]

export function Login() {
  const { login, user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from?.pathname ?? null

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [socialMsg, setSocialMsg] = useState('')

  if (user) return <Navigate to={user.role === 'client' ? '/demo/barberia' : (from ?? roleHome(user.role))} replace />

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSocialMsg('')
    setLoading(true)
    try {
      const u = await login(email.trim(), password)
      navigate(u.role === 'client' ? '/demo/barberia' : (from ?? roleHome(u.role)), { replace: true })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  function fillDemo(u) {
    setEmail(u.email)
    setPassword(u.password)
    setError('')
  }

  function handleSocial(provider) {
    setSocialMsg(`${provider} estará disponible en Fase 2 al configurar Supabase Auth OAuth.`)
  }

  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      <AuthShell showMenu={false}>
        <h1 className="mb-6 text-2xl font-bold text-[#1c1c1e]">Iniciar sesión</h1>

        {/* Social login */}
        <div className="flex flex-col gap-2 mb-5">
          <SocialButton onClick={() => handleSocial('Google')} icon={<GoogleIcon />} label="Continuar con Google" />
          <SocialButton onClick={() => handleSocial('Apple')} icon={<AppleIcon />} label="Continuar con Apple" dark />
          <SocialButton onClick={() => handleSocial('Facebook')} icon={<FacebookIcon />} label="Continuar con Facebook" blue />
        </div>

        {socialMsg && (
          <div className="mb-4 rounded-lg bg-blue-50 px-3 py-2 text-xs text-blue-700">{socialMsg}</div>
        )}

        <div className="relative mb-5 flex items-center gap-3">
          <div className="h-px flex-1 bg-[#e5e5ea]" />
          <span className="text-xs text-[#8e8e93]">o con email</span>
          <div className="h-px flex-1 bg-[#e5e5ea]" />
        </div>

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
              autoComplete="current-password"
            />
          </label>

          <button
            type="submit"
            disabled={loading}
            className="mt-1 rounded-lg bg-[#c9a24b] py-2.5 text-sm font-semibold text-white transition-opacity disabled:opacity-50"
          >
            {loading ? 'Entrando…' : 'Entrar'}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-[#6e6e73]">
          ¿No tienes cuenta?{' '}
          <Link to="/registro" className="font-medium text-[#c9a24b] hover:underline">
            Regístrate
          </Link>
        </p>

        {/* Demo users */}
        <details className="mt-5">
          <summary className="cursor-pointer text-xs text-[#8e8e93] hover:text-[#6e6e73]">
            Usuarios de prueba
          </summary>
          <div className="mt-2 flex flex-col gap-1">
            {DEMO_USERS.map(u => (
              <button
                key={u.email}
                type="button"
                onClick={() => fillDemo(u)}
                className="flex items-center justify-between rounded-lg bg-[#f5f5f5] px-3 py-2 text-left text-xs hover:bg-[#ebebeb]"
              >
                <span className="text-[#3a3a3c]">{u.email}</span>
                <span className="rounded-full bg-[#e5e5ea] px-2 py-0.5 text-[10px] font-semibold text-[#6e6e73]">
                  {u.role}
                </span>
              </button>
            ))}
          </div>
        </details>
      </AuthShell>
    </div>
  )
}

function SocialButton({ onClick, icon, label, dark, blue }) {
  let cls = 'flex w-full items-center gap-3 rounded-lg border px-4 py-2.5 text-sm font-medium transition-opacity hover:opacity-80'
  if (dark) cls += ' bg-black border-black text-white'
  else if (blue) cls += ' bg-[#1877F2] border-[#1877F2] text-white'
  else cls += ' border-[#d1d1d6] bg-white text-[#1c1c1e]'
  return (
    <button type="button" onClick={onClick} className={cls}>
      <span className="h-5 w-5 shrink-0">{icon}</span>
      <span className="flex-1 text-center">{label}</span>
    </button>
  )
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M47.5 24.6c0-1.6-.1-3.1-.4-4.6H24v8.7h13.2c-.6 3-2.3 5.6-4.9 7.3v6h7.9c4.7-4.3 7.3-10.6 7.3-17.4z" fill="#4285F4"/>
      <path d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.9-6c-2.1 1.4-4.9 2.2-8 2.2-6.1 0-11.3-4.1-13.2-9.7H2.7v6.2C6.7 42.8 14.8 48 24 48z" fill="#34A853"/>
      <path d="M10.8 28.7A14.2 14.2 0 0 1 10 24c0-1.6.3-3.2.8-4.7v-6.2H2.7A23.9 23.9 0 0 0 0 24c0 3.9.9 7.5 2.7 10.9l8.1-6.2z" fill="#FBBC05"/>
      <path d="M24 9.6c3.4 0 6.5 1.2 8.9 3.5l6.7-6.7C35.8 2.4 30.4 0 24 0 14.8 0 6.7 5.2 2.7 13.1l8.1 6.2C12.7 13.7 17.9 9.6 24 9.6z" fill="#EA4335"/>
    </svg>
  )
}

function AppleIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.7 9.05 7.4c1.28.07 2.16.71 2.91.71.8 0 2.28-.88 3.84-.75 1.55.13 2.71.84 3.45 2.13-3.17 1.89-2.67 5.97.6 7.14-.57 1.37-1.35 2.73-2.8 3.65zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
    </svg>
  )
}

function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M24 12.07C24 5.41 18.63 0 12 0S0 5.41 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.04V9.41c0-3.02 1.8-4.7 4.54-4.7 1.31 0 2.68.24 2.68.24v2.97h-1.5c-1.49 0-1.95.93-1.95 1.88v2.27h3.32l-.53 3.49h-2.79V24C19.62 23.1 24 18.1 24 12.07z"/>
    </svg>
  )
}

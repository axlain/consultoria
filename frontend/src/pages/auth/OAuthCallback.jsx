import { useEffect, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { roleHome } from '../../components/ProtectedRoute'
import { AuthShell } from '../../components/AuthShell'
import { BusinessSelect } from '../../components/BusinessSelect'

// Landing page for the Supabase OAuth redirect (Google / Facebook). Supabase-js
// parses the session out of the redirect URL on load; once it's available we
// exchange it for the app's own token via AuthContext and continue.
export function OAuthCallback() {
  const { user, loginWithSupabaseToken } = useAuth()
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const [businessOptions, setBusinessOptions] = useState(null)
  const [accessToken, setAccessToken] = useState(null)
  const [choosing, setChoosing] = useState(false)

  useEffect(() => {
    if (!supabase) {
      setError('Login social no configurado (faltan variables VITE_SUPABASE_*).')
      return
    }

    let cancelled = false

    async function finish(session) {
      try {
        const result = await loginWithSupabaseToken(session.access_token)
        if (cancelled) return
        if (result.requires_business_selection) {
          setAccessToken(session.access_token)
          setBusinessOptions(result.businesses)
          return
        }
        navigate(result.role === 'client' ? '/demo/barberia' : roleHome(result.role), { replace: true })
      } catch (err) {
        if (!cancelled) setError(err.message)
      }
    }

    supabase.auth.getSession().then(({ data }) => {
      if (data.session) finish(data.session)
    })

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) finish(session)
    })

    return () => {
      cancelled = true
      sub.subscription.unsubscribe()
    }
  }, [loginWithSupabaseToken, navigate])

  async function chooseBusiness(businessId) {
    setError('')
    setChoosing(true)
    try {
      const u = await loginWithSupabaseToken(accessToken, businessId)
      navigate(u.role === 'client' ? '/demo/barberia' : roleHome(u.role), { replace: true })
    } catch (err) {
      setError(err.message)
    } finally {
      setChoosing(false)
    }
  }

  if (user) return <Navigate to={user.role === 'client' ? '/demo/barberia' : roleHome(user.role)} replace />

  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      <AuthShell showMenu={false}>
        {businessOptions && <h1 className="mb-6 text-2xl font-bold text-[#1c1c1e]">Elige un negocio</h1>}

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        {businessOptions ? (
          <BusinessSelect businesses={businessOptions} onSelect={chooseBusiness} loading={choosing} />
        ) : error ? (
          <Link to="/login" className="font-medium text-[#c9a24b] hover:underline">
            Volver a iniciar sesión
          </Link>
        ) : (
          <p className="text-center text-sm text-[#6e6e73]">Conectando tu cuenta…</p>
        )}
      </AuthShell>
    </div>
  )
}

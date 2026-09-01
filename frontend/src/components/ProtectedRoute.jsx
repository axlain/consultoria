import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

/**
 * Wraps a route so only users with an allowed role can access it.
 * Unauthenticated users are sent to /login.
 * Authenticated users without the right role are sent to their role's home.
 */
export function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) return null

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to={roleHome(user.role)} replace />
  }

  return children
}

export function roleHome(role) {
  switch (role) {
    case 'admin':   return '/panel/transacciones'
    case 'host':    return '/panel/equipo'
    case 'employee': return '/panel/mi-agenda'
    case 'client':  return '/panel/mis-citas'
    default:        return '/'
  }
}

// Where to send a logged-in user after auth. Clients land on their own
// tenant's storefront (never a hardcoded business), everyone else on their panel.
export function authHome(user) {
  if (!user) return '/login'
  return user.role === 'client' ? `/demo/${user.business_id}` : roleHome(user.role)
}

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

const AuthContext = createContext(null)

const STORAGE_KEY = 'auth_session'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const { user, token } = JSON.parse(raw)
        setUser(user)
        setToken(token)
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY)
    } finally {
      setLoading(false)
    }
  }, [])

  const _persist = useCallback((user, token) => {
    setUser(user)
    setToken(token)
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ user, token }))
  }, [])

  const login = useCallback(async (email, password) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.detail ?? 'Error al iniciar sesión')
    }
    const data = await res.json()
    _persist(data.user, data.access_token)
    return data.user
  }, [_persist])

  const register = useCallback(async (email, password, name, businessId = 'barberia') => {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name, business_id: businessId }),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.detail ?? 'Error al registrarse')
    }
    const data = await res.json()
    _persist(data.user, data.access_token)
    return data.user
  }, [_persist])

  const logout = useCallback(() => {
    setUser(null)
    setToken(null)
    localStorage.removeItem(STORAGE_KEY)
  }, [])

  const value = useMemo(
    () => ({ user, token, loading, login, register, logout, isAuthenticated: !!user }),
    [user, token, loading, login, register, logout]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}

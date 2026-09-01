import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { api } from '../api/client'

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

  // Returns the logged-in user, or { requires_business_selection: true, businesses }
  // when the account belongs to more than one business and none was specified —
  // callers should re-call with the chosen businessId to finish logging in.
  const login = useCallback(async (email, password, businessId = null) => {
    const data = await api.login(email, password, businessId)
    if (data.requires_business_selection) return data
    _persist(data.user, data.access_token)
    return data.user
  }, [_persist])

  const register = useCallback(async (email, password, name, businessId = 'levisalon-keratinas') => {
    const data = await api.register(email, password, name, businessId)
    _persist(data.user, data.access_token)
    return data.user
  }, [_persist])

  const loginWithSupabaseToken = useCallback(async (supabaseAccessToken, businessId = null) => {
    const data = await api.oauthSession(supabaseAccessToken, businessId)
    if (data.requires_business_selection) return data
    _persist(data.user, data.access_token)
    return data.user
  }, [_persist])

  const logout = useCallback(() => {
    setUser(null)
    setToken(null)
    localStorage.removeItem(STORAGE_KEY)
  }, [])

  const value = useMemo(
    () => ({ user, token, loading, login, register, loginWithSupabaseToken, logout, isAuthenticated: !!user }),
    [user, token, loading, login, register, loginWithSupabaseToken, logout]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}

import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { api } from '../api/client'

const TenantContext = createContext(null)

// RF01/RF02: resolve the tenant from the URL slug and fetch its config once per slug.
export function TenantProvider({ slug, children }) {
  const [tenant, setTenant] = useState(null)
  const [status, setStatus] = useState('loading') // 'loading' | 'ready' | 'not-found' | 'error'

  const load = useCallback(() => {
    setStatus('loading')
    return api
      .getTenant(slug)
      .then((data) => {
        setTenant(data)
        setStatus('ready')
      })
      .catch((err) => {
        setStatus(err.status === 404 ? 'not-found' : 'error')
      })
  }, [slug])

  useEffect(() => {
    let cancelled = false
    setStatus('loading')
    setTenant(null)

    api
      .getTenant(slug)
      .then((data) => {
        if (cancelled) return
        setTenant(data)
        setStatus('ready')
      })
      .catch((err) => {
        if (cancelled) return
        setStatus(err.status === 404 ? 'not-found' : 'error')
      })

    return () => {
      cancelled = true
    }
  }, [slug])

  useEffect(() => {
    if (!tenant?.theme?.secondary_color) return
    const root = document.documentElement
    // Only the accent (brand highlight) is tenant-driven — ink/paper/surface stay
    // owned by ThemeContext's light/dark tokens so contrast stays guaranteed
    // regardless of what color a tenant picks. accent-light is derived via
    // color-mix so tenants don't need to supply a matching hover shade.
    root.style.setProperty('--color-accent', tenant.theme.secondary_color)
    root.style.setProperty('--color-accent-light', `color-mix(in srgb, ${tenant.theme.secondary_color} 70%, white)`)
  }, [tenant])

  // Exposed so CRUD screens (services/team) can refetch after a mutation without a full reload.
  return (
    <TenantContext.Provider value={{ tenant, status, refreshTenant: load }}>
      {children}
    </TenantContext.Provider>
  )
}

export function useTenant() {
  const ctx = useContext(TenantContext)
  if (!ctx) throw new Error('useTenant must be used within a TenantProvider')
  return ctx
}

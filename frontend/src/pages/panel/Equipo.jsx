import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { api } from '../../api/client'
import { TeamCalendar } from '../../components/TeamCalendar'

// Team/agenda calendar for host+admin: occupied slots vs. free gaps per
// barber, for assigning new appointments or walk-ins efficiently. Fetches
// the tenant config directly (rather than TenantProvider, which also pushes
// the tenant's public storefront theme onto the page — not wanted here).
export function Equipo() {
  const { user } = useAuth()
  const slug = user?.business_id || 'levisalon-keratinas'

  const [tenant, setTenant] = useState(null)
  const [error, setError] = useState('')

  function load() {
    setError('')
    api.getTenant(slug).then(setTenant).catch((err) => setError(err.message))
  }

  useEffect(() => { load() }, [slug])

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <Link
          to="/panel/equipo/nueva-cita"
          className="rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-[#0C0B09] no-underline hover:bg-accent-light transition-colors"
        >
          + Nueva cita (walk-in)
        </Link>
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      {!tenant && !error && (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl bg-surface" />
          ))}
        </div>
      )}

      {tenant && <TeamCalendar tenant={tenant} onRefresh={load} title="Equipo" desktopView="list" />}
    </div>
  )
}

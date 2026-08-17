import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTenant } from '../../context/TenantContext'
import { api } from '../../api/client'
import { ClientShell } from '../../components/ClientShell'
import { DateStrip, buildDateRange, toIso } from '../../components/DateStrip'

const DAYS_AHEAD = 14
const DATE_STRIP = buildDateRange(DAYS_AHEAD)

// Public read-only calendar: lets a client check availability before committing to
// the wizard, or scope it to a specific barber they already trust. Informational
// only — booking still happens through /reservar.
export function AvailabilityCalendar() {
  const { tenant } = useTenant()
  const [selectedDate, setSelectedDate] = useState(toIso(DATE_STRIP[0]))
  const [professionalId, setProfessionalId] = useState('')
  const [open, setOpen] = useState(true)
  const [slots, setSlots] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const activeProfessionals = tenant.professionals.filter((p) => p.active)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(false)

    api
      .getAvailability(tenant.slug, { date: selectedDate, professionalId: professionalId || undefined })
      .then((data) => {
        if (!cancelled) {
          setOpen(data.open)
          setSlots(data.slots)
        }
      })
      .catch(() => {
        if (!cancelled) setError(true)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [tenant.slug, selectedDate, professionalId])

  return (
    <ClientShell>
      <h2>Ver disponibilidad</h2>
      <p className="text-muted mb-5 text-sm">Consulta los horarios libres antes de reservar.</p>

      <div className="mb-5">
        <DateStrip dates={DATE_STRIP} selectedDate={selectedDate} onSelect={setSelectedDate} />
      </div>

      <label className="mb-5 flex flex-col gap-1.5 text-sm font-medium">
        Profesional
        <select
          className="border-line focus-visible:border-secondary rounded-lg border bg-white p-[0.6rem] text-base"
          value={professionalId}
          onChange={(e) => setProfessionalId(e.target.value)}
        >
          <option value="">Todos los profesionales</option>
          {activeProfessionals.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </label>

      {loading && (
        <div className="flex flex-wrap gap-2" aria-live="polite" aria-busy="true">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-line h-[42px] w-20 animate-pulse rounded-full" />
          ))}
        </div>
      )}

      {!loading && error && (
        <div className="border-line rounded-xl border bg-white px-4 py-5 text-center">
          <p className="text-muted text-sm">Hubo un problema al cargar la disponibilidad. Intenta de nuevo.</p>
        </div>
      )}

      {!loading && !error && !open && (
        <p className="text-muted text-sm">
          {professionalId ? 'Este profesional no labora este día.' : 'Nadie labora este día.'} Elige otra fecha.
        </p>
      )}

      {!loading && !error && open && slots.length === 0 && (
        <p className="text-muted text-sm">No hay horarios configurados para esta fecha.</p>
      )}

      {!loading && !error && open && slots.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {slots.map(({ time, available }) => (
            <span
              key={time}
              className={
                available
                  ? 'rounded-full border border-[#2e7d32] bg-[#2e7d3214] px-4 py-2.5 text-sm font-medium tabular-nums text-[#2e7d32]'
                  : 'border-line text-muted rounded-full border bg-white px-4 py-2.5 text-sm font-medium tabular-nums line-through opacity-60'
              }
            >
              {time}
            </span>
          ))}
        </div>
      )}

      <Link
        to={`/demo/${tenant.slug}/reservar`}
        className="bg-secondary mt-7 inline-block rounded-full px-6 py-2.5 text-sm font-semibold text-white no-underline transition-transform duration-150 hover:scale-[1.02] active:scale-[0.98]"
      >
        Reservar cita
      </Link>
    </ClientShell>
  )
}

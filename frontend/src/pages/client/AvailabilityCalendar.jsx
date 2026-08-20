import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTenant } from '../../context/TenantContext'
import { api } from '../../api/client'
import { ClientShell } from '../../components/ClientShell'
import { HamburgerMenu } from '../../components/HamburgerMenu'
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

  const selectClass =
    'rounded-xl border border-[#2A2520] bg-[#1E1B15] p-[0.6rem] text-base text-[#F2EBE0] outline-none focus:border-[#C8973E] transition-colors'

  return (
    <ClientShell wide>
      <HamburgerMenu faqs={tenant.faqs} slug={tenant.slug} className="lg:hidden" />

      {/* Desktop card: same shared-block language as the booking wizard, so this
          page doesn't feel like a separate, disconnected screen on large viewports. */}
      <div className="md:max-w-2xl md:mx-auto lg:max-w-4xl lg:my-12 lg:rounded-3xl lg:border lg:border-[#2A2520] lg:bg-[#1E1B15] lg:overflow-hidden">
        {/* Unified header bar (desktop only) */}
        <div className="hidden lg:flex lg:items-center lg:justify-between lg:border-b lg:border-[#2A2520] lg:px-8 lg:py-5">
          <div>
            <h2 className="m-0 text-lg font-bold text-[#F2EBE0]">Ver disponibilidad</h2>
            <p className="m-0 text-xs text-[#7A7065]">Consulta los horarios libres antes de reservar.</p>
          </div>
          <HamburgerMenu faqs={tenant.faqs} slug={tenant.slug} inline />
        </div>

        <div className="px-5 pt-10 pb-10 lg:px-10 lg:pt-8 lg:pb-10">
          <h2 className="pr-14 text-[#F2EBE0] lg:hidden">Ver disponibilidad</h2>
          <p className="mb-6 text-sm text-[#7A7065] lg:hidden">Consulta los horarios libres antes de reservar.</p>

          {/* Fecha — its own block, full width, so the date strip never shares
              flex space (and its scroll bleed) with a sibling control. */}
          <div className="mb-6">
            <p className="mb-2 text-xs font-bold uppercase tracking-wider text-[#7A7065]">Fecha</p>
            <DateStrip dates={DATE_STRIP} selectedDate={selectedDate} onSelect={setSelectedDate} />
          </div>

          {/* Profesional — separate card, independent from the date/horarios block. */}
          <div className="mb-7 rounded-xl border border-[#2A2520] bg-[#161410] p-4">
            <label className="flex flex-col gap-1.5 text-sm font-medium text-[#7A7065] lg:max-w-xs">
              Profesional
              <select
                className={selectClass}
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
          </div>

          <p className="mb-3 text-xs font-bold uppercase tracking-wider text-[#7A7065]">Horarios</p>

          {loading && (
            <div className="flex flex-wrap gap-2 lg:grid lg:grid-cols-6" aria-live="polite" aria-busy="true">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-[42px] w-20 animate-pulse rounded-xl bg-[#1E1B15] lg:w-auto" />
              ))}
            </div>
          )}

          {!loading && error && (
            <div className="rounded-xl border border-[#2A2520] bg-[#161410] px-4 py-5 text-center">
              <p className="text-sm text-[#7A7065]">Hubo un problema al cargar la disponibilidad. Intenta de nuevo.</p>
            </div>
          )}

          {!loading && !error && !open && (
            <p className="text-sm text-[#7A7065]">
              {professionalId ? 'Este profesional no labora este día.' : 'Nadie labora este día.'} Elige otra fecha.
            </p>
          )}

          {!loading && !error && open && slots.length === 0 && (
            <p className="text-sm text-[#7A7065]">No hay horarios configurados para esta fecha.</p>
          )}

          {!loading && !error && open && slots.length > 0 && (
            <div className="flex flex-wrap gap-2 lg:grid lg:grid-cols-6 lg:gap-3">
              {slots.map(({ time, available }) => (
                <span
                  key={time}
                  className={
                    available
                      ? 'rounded-xl border border-[#C8973E] bg-[#C8973E]/10 px-4 py-2.5 text-center text-sm font-medium tabular-nums text-[#C8973E]'
                      : 'rounded-xl border border-[#2A2520] bg-[#161410] px-4 py-2.5 text-center text-sm font-medium tabular-nums text-[#2A2520] line-through opacity-40'
                  }
                >
                  {time}
                </span>
              ))}
            </div>
          )}

          <Link
            to={`/demo/${tenant.slug}/reservar`}
            className="mt-8 inline-block rounded-2xl bg-[#C8973E] px-6 py-2.5 text-sm font-semibold text-[#0C0B09] no-underline transition-all hover:bg-[#E8B86D] active:scale-[0.98]"
          >
            Reservar cita
          </Link>
        </div>
      </div>
    </ClientShell>
  )
}

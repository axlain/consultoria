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
  const [selectedTime, setSelectedTime] = useState('')
  const [open, setOpen] = useState(true)
  const [slots, setSlots] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  // A specific hour is only meaningful for the date/professional it was
  // fetched under — changing either invalidates whatever was picked before.
  function handleDateSelect(iso) {
    setSelectedDate(iso)
    setSelectedTime('')
  }

  function handleProfessionalChange(id) {
    setProfessionalId(id)
    setSelectedTime('')
  }

  const canReserve = Boolean(selectedDate && selectedTime)

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
    'rounded-xl border border-line bg-surface p-[0.6rem] text-base text-ink outline-none focus:border-accent transition-colors'

  return (
    <ClientShell wide>
      <HamburgerMenu faqs={tenant.faqs} slug={tenant.slug} className="lg:hidden" />

      {/* Desktop card: same shared-block language as the booking wizard, so this
          page doesn't feel like a separate, disconnected screen on large viewports. */}
      <div className="wizard-step-scroll md:max-w-2xl md:mx-auto lg:max-w-4xl lg:my-12 lg:rounded-3xl lg:border lg:border-line lg:bg-surface lg:overflow-hidden">
        {/* Unified header bar (desktop only) */}
        <div className="hidden lg:flex lg:items-center lg:justify-between lg:border-b lg:border-line lg:px-8 lg:py-5">
          <div>
            <h2 className="m-0 text-lg font-bold text-ink">Ver disponibilidad</h2>
            <p className="m-0 text-xs text-muted">Consulta los horarios libres antes de reservar.</p>
          </div>
          <HamburgerMenu faqs={tenant.faqs} slug={tenant.slug} inline />
        </div>

        <div className="px-5 pt-10 pb-10 lg:px-10 lg:pt-8 lg:pb-10">
          <h2 className="pr-14 text-ink lg:hidden">Ver disponibilidad</h2>
          <p className="mb-6 text-sm text-muted lg:hidden">Consulta los horarios libres antes de reservar.</p>

          {/* Fecha — its own block, full width, so the date strip never shares
              flex space (and its scroll bleed) with a sibling control. */}
          <div className="mb-6">
            <p className="mb-2 text-xs font-bold uppercase tracking-wider text-muted">Fecha</p>
            <DateStrip dates={DATE_STRIP} selectedDate={selectedDate} onSelect={handleDateSelect} />
          </div>

          {/* Profesional — separate card, independent from the date/horarios block. */}
          <div className="mb-7 rounded-xl border border-line bg-surface-alt p-4">
            <label className="flex flex-col gap-1.5 text-sm font-medium text-muted lg:max-w-xs">
              Profesional
              <select
                className={selectClass}
                value={professionalId}
                onChange={(e) => handleProfessionalChange(e.target.value)}
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

          <p className="mb-3 text-xs font-bold uppercase tracking-wider text-muted">
            Horarios <span className="normal-case font-normal text-muted/80">— elige uno para reservar</span>
          </p>

          {loading && (
            <div className="flex flex-wrap gap-2 lg:grid lg:grid-cols-6" aria-live="polite" aria-busy="true">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-[42px] w-20 animate-pulse rounded-xl bg-surface lg:w-auto" />
              ))}
            </div>
          )}

          {!loading && error && (
            <div className="rounded-xl border border-line bg-surface-alt px-4 py-5 text-center">
              <p className="text-sm text-muted">Hubo un problema al cargar la disponibilidad. Intenta de nuevo.</p>
            </div>
          )}

          {!loading && !error && !open && (
            <p className="text-sm text-muted">
              {professionalId ? 'Este profesional no labora este día.' : 'Nadie labora este día.'} Elige otra fecha.
            </p>
          )}

          {!loading && !error && open && slots.length === 0 && (
            <p className="text-sm text-muted">No hay horarios configurados para esta fecha.</p>
          )}

          {!loading && !error && open && slots.length > 0 && (
            <div className="flex flex-wrap gap-2 lg:grid lg:grid-cols-6 lg:gap-3">
              {slots.map(({ time, available }) => {
                const selected = available && time === selectedTime
                return (
                  <button
                    key={time}
                    type="button"
                    disabled={!available}
                    aria-pressed={selected}
                    onClick={() => available && setSelectedTime(time)}
                    className={
                      selected
                        ? 'rounded-xl border border-accent bg-accent px-4 py-2.5 text-center text-sm font-bold tabular-nums text-[#0C0B09] transition-all'
                        : available
                        ? 'slot-available rounded-xl border border-accent bg-accent/10 px-4 py-2.5 text-center text-sm font-medium tabular-nums text-accent transition-all'
                        : 'cursor-not-allowed rounded-xl border border-line bg-surface-alt px-4 py-2.5 text-center text-sm font-medium tabular-nums text-line line-through opacity-40'
                    }
                  >
                    {time}
                  </button>
                )
              })}
            </div>
          )}

          {!loading && !error && open && slots.length > 0 && !selectedTime && (
            <p className="mt-3 text-xs text-muted">Selecciona un horario disponible para poder reservar.</p>
          )}

          {/* Spacer so the fixed mobile CTA never covers the content above it. */}
          <div className="wizard-cta-spacer lg:hidden" />

          {/* Desktop: button sits inline, no scrolling viewport to fight. Disabled
              (plain button, no navigation) until a date AND a time are both picked. */}
          {canReserve ? (
            <Link
              to={`/demo/${tenant.slug}/reservar`}
              state={{ preselect: { date: selectedDate, time: selectedTime, professionalId: professionalId || null } }}
              className="mt-8 hidden lg:inline-block rounded-2xl bg-accent px-6 py-2.5 text-sm font-semibold text-[#0C0B09] no-underline transition-all hover:bg-accent-light active:scale-[0.98]"
            >
              Reservar cita
            </Link>
          ) : (
            <button
              type="button"
              disabled
              className="mt-8 hidden lg:inline-block cursor-not-allowed rounded-2xl bg-line px-6 py-2.5 text-sm font-semibold text-muted"
            >
              Reservar cita
            </button>
          )}
        </div>
      </div>

      {/* Mobile: fixed to the real viewport so it's always reachable, however
          long the availability grid gets. */}
      <div className="wizard-cta-bar mx-auto flex max-w-[430px] justify-center border-t border-line bg-paper/95 px-5 py-4 backdrop-blur-sm md:max-w-2xl lg:hidden">
        {canReserve ? (
          <Link
            to={`/demo/${tenant.slug}/reservar`}
            state={{ preselect: { date: selectedDate, time: selectedTime, professionalId: professionalId || null } }}
            className="block w-full rounded-2xl bg-accent px-6 py-3 text-center text-sm font-bold text-[#0C0B09] no-underline transition-all hover:bg-accent-light active:scale-[0.98]"
          >
            Reservar cita
          </Link>
        ) : (
          <button
            type="button"
            disabled
            className="block w-full cursor-not-allowed rounded-2xl bg-line px-6 py-3 text-center text-sm font-bold text-muted"
          >
            Reservar cita
          </button>
        )}
      </div>
    </ClientShell>
  )
}

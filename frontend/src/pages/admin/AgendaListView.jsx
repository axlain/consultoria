import { useEffect, useMemo, useState } from 'react'
import { api } from '../../api/client'
import { buildDateRange, toIso } from '../../components/DateStrip'
import { appointmentAccentColor, isClosedStatus } from './appointmentStatus'

const WEEK_DAYS = 7
const MONTHS_ES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
const WEEKDAYS_LONG_ES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
// Date.getDay() indexes from Sunday=0 — the backend's day-off codes start at Monday,
// so this remaps JS's weekday index to that same "mon".."sun" vocabulary.
const WEEKDAY_CODES_BY_JS_DAY = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']

function dayLabel(date) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(today.getDate() + 1)

  const dayMonth = `${date.getDate()} ${MONTHS_ES[date.getMonth()]}`
  if (toIso(date) === toIso(today)) return `Hoy, ${dayMonth}`
  if (toIso(date) === toIso(tomorrow)) return `Mañana, ${dayMonth}`
  return `${WEEKDAYS_LONG_ES[date.getDay()]}, ${dayMonth}`
}

function toMinutes(hhmm) {
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + m
}

function formatMinutes(mins) {
  const h = String(Math.floor(mins / 60)).padStart(2, '0')
  const m = String(mins % 60).padStart(2, '0')
  return `${h}:${m}`
}

// For one day: appointment cards to show (including completed/no_show ones, just
// dimmed — so the barber can still see who they've already seen today), plus each
// relevant professional's free gaps (schedule minus their booked time). No_show
// appointments don't block a gap — same rule the backend's own availability
// calculation uses (booking_service.get_available_slots).
function buildDayEntries(date, appointments, services, relevantProfessionals) {
  const iso = toIso(date)
  const weekdayCode = WEEKDAY_CODES_BY_JS_DAY[date.getDay()]

  const visibleAppointments = appointments.filter(
    (apt) => apt.date === iso && relevantProfessionals.some((p) => p.id === apt.professional_id),
  )

  const busyByProfessional = new Map()
  for (const apt of appointments) {
    if (apt.date !== iso || apt.status === 'no_show') continue
    if (!relevantProfessionals.some((p) => p.id === apt.professional_id)) continue
    const service = services.find((s) => s.id === apt.service_id)
    const start = toMinutes(apt.time)
    const end = start + (service?.duration_minutes ?? 30)
    const list = busyByProfessional.get(apt.professional_id) ?? []
    list.push([start, end])
    busyByProfessional.set(apt.professional_id, list)
  }

  const gaps = []
  for (const professional of relevantProfessionals) {
    if (professional.days_off.includes(weekdayCode)) continue
    const scheduleStart = toMinutes(professional.schedule.start)
    const scheduleEnd = toMinutes(professional.schedule.end)
    const minGap = professional.schedule.slot_minutes
    const busy = (busyByProfessional.get(professional.id) ?? []).sort((a, b) => a[0] - b[0])

    let cursor = scheduleStart
    for (const [busyStart, busyEnd] of busy) {
      if (busyStart - cursor >= minGap) gaps.push({ start: cursor, end: busyStart, professional })
      cursor = Math.max(cursor, busyEnd)
    }
    if (scheduleEnd - cursor >= minGap) gaps.push({ start: cursor, end: scheduleEnd, professional })
  }

  return [
    ...visibleAppointments.map((apt) => ({ kind: 'appointment', time: toMinutes(apt.time), appointment: apt })),
    ...gaps.map((gap) => ({ kind: 'gap', time: gap.start, gap })),
  ].sort((a, b) => a.time - b.time)
}

// Mobile agenda: the only mobile view (the hour-grid felt too cramped on a phone).
// A week-ahead, read-only rundown grouped by day. `mode` picks which kind of entry
// to show — 'citas' (booked appointments) or 'disponibilidad' (each professional's
// free gaps) — kept in separate tabs rather than interleaved, since mixing both got
// visually noisy once several barbers had gaps on the same day.
export function AgendaListView({
  tenantSlug,
  professionals,
  services,
  professionalFilter,
  onSelectEvent,
  mode,
  startDate,
}) {
  const entryKind = mode === 'disponibilidad' ? 'gap' : 'appointment'
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    api
      .getAgenda(tenantSlug)
      .then((data) => {
        if (!cancelled) setAppointments(data)
      })
      .catch((err) => {
        if (!cancelled) setError(err.message)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [tenantSlug])

  // Re-centers the week window on whichever date is picked in the strip above,
  // instead of always starting at today — otherwise tapping a different day did
  // nothing, since this list ignored the selection entirely.
  const days = useMemo(() => buildDateRange(WEEK_DAYS, startDate), [startDate])

  const relevantProfessionals = useMemo(
    () =>
      professionals.filter((p) => p.active && (professionalFilter === 'all' || p.id === professionalFilter)),
    [professionals, professionalFilter],
  )

  const groupedDays = useMemo(() => {
    return days
      .map((date) => ({
        date,
        iso: toIso(date),
        entries: buildDayEntries(date, appointments, services, relevantProfessionals).filter(
          (e) => e.kind === entryKind,
        ),
      }))
      .filter((day) => day.entries.length > 0)
  }, [days, appointments, services, relevantProfessionals, entryKind])

  if (loading) {
    return (
      <div className="flex flex-col gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-line h-16 animate-pulse rounded-xl" />
        ))}
      </div>
    )
  }

  if (error) return <p className="text-sm text-[#c0392b]">{error}</p>

  if (groupedDays.length === 0) {
    return (
      <p className="text-muted text-sm">
        {entryKind === 'gap' ? 'No hay espacios libres esta semana.' : 'No hay citas próximas esta semana.'}
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {groupedDays.map(({ date, iso, entries }) => (
        <div key={iso}>
          <h3 className="text-muted mb-2 border-0 p-0 text-sm font-semibold tracking-wide uppercase">
            {dayLabel(date)}
          </h3>
          <div className="flex flex-col gap-2">
            {entries.map((entry) => {
              if (entry.kind === 'gap') {
                const { gap } = entry
                return (
                  <div
                    key={`gap-${gap.professional.id}-${gap.start}`}
                    className="border-line flex items-center gap-3 rounded-xl border border-dashed p-3"
                  >
                    <span className="w-12 shrink-0 text-sm tabular-nums text-[#aaa]">
                      {formatMinutes(gap.start)}
                    </span>
                    <span className="text-sm text-[#aaa]">
                      {formatMinutes(gap.start)}–{formatMinutes(gap.end)} · Espacio libre · {gap.professional.name}
                    </span>
                  </div>
                )
              }

              const apt = entry.appointment
              const service = services.find((s) => s.id === apt.service_id)
              const professional = professionals.find((p) => p.id === apt.professional_id)
              return (
                <button
                  key={apt.id}
                  type="button"
                  onClick={() =>
                    onSelectEvent({
                      id: apt.id,
                      title: `${apt.customer_name} ${apt.customer_last_name} · ${service?.name ?? apt.service_id}`,
                      status: apt.status,
                      appointment: apt,
                    })
                  }
                  className={`border-line flex items-center gap-3 rounded-xl border bg-white p-3 text-left ${
                    isClosedStatus(apt.status) ? 'opacity-60' : ''
                  }`}
                >
                  <span
                    className="h-8 w-1 shrink-0 rounded-full"
                    style={{ backgroundColor: appointmentAccentColor(apt, service) }}
                  />
                  <span className="w-12 shrink-0 text-sm font-semibold tabular-nums">{apt.time}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">
                      {apt.customer_name} {apt.customer_last_name}
                    </span>
                    <span className="text-muted block truncate text-sm">
                      {service?.name ?? apt.service_id} · {professional?.name ?? apt.professional_id}
                    </span>
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

import { useEffect, useMemo, useState } from 'react'
import { Calendar, Views, dateFnsLocalizer } from 'react-big-calendar'
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop'
import { format, getDay, parse, startOfWeek } from 'date-fns'
import { es } from 'date-fns/locale'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css'
import { useTenant } from '../../context/TenantContext'
import { api } from '../../api/client'
import { DateStrip, buildDateRange } from '../../components/DateStrip'
import { AgendaListView } from './AgendaListView'
import { STATUS_LABELS, appointmentAccentColor, isClosedStatus } from './appointmentStatus'

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { locale: es }),
  getDay,
  locales: { es },
})

const DnDCalendar = withDragAndDrop(Calendar)

const DATE_STRIP_DAYS = 14
const DATE_STRIP = buildDateRange(DATE_STRIP_DAYS)

function toMinutes(hhmm) {
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + m
}

function minutesToDate(minutes) {
  return new Date(0, 0, 0, Math.floor(minutes / 60), minutes % 60)
}

// RF06 evolved: date-strip navigation (shared with the client booking wizard) drives
// the desktop resource grid; mobile gets its own week-ahead list view instead of the
// drag-and-drop resource grid, which doesn't fit a phone width.
export function ResourceCalendar() {
  const { tenant, refreshTenant } = useTenant()
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [professionalFilter, setProfessionalFilter] = useState('all')
  const [appointments, setAppointments] = useState([])
  const [error, setError] = useState(null)
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [mobileMode, setMobileMode] = useState('citas')

  const dateStr = format(selectedDate, 'yyyy-MM-dd')

  useEffect(() => {
    let cancelled = false
    api
      .getAgenda(tenant.slug, dateStr)
      .then((data) => {
        if (!cancelled) setAppointments(data)
      })
      .catch((err) => {
        if (!cancelled) setError(err.message)
      })
    return () => {
      cancelled = true
    }
  }, [tenant.slug, dateStr])

  const resources = useMemo(() => {
    const active = tenant.professionals.filter((p) => p.active)
    return professionalFilter === 'all' ? active : active.filter((p) => p.id === professionalFilter)
  }, [tenant.professionals, professionalFilter])

  const { min, max } = useMemo(() => {
    if (resources.length === 0) return { min: minutesToDate(8 * 60), max: minutesToDate(21 * 60) }
    const starts = resources.map((p) => toMinutes(p.schedule.start))
    const ends = resources.map((p) => toMinutes(p.schedule.end))
    return { min: minutesToDate(Math.min(...starts)), max: minutesToDate(Math.max(...ends)) }
  }, [resources])

  const events = useMemo(() => {
    return appointments
      .filter((apt) => resources.some((r) => r.id === apt.professional_id))
      .map((apt) => {
        const service = tenant.services.find((s) => s.id === apt.service_id)
        const start = parse(`${apt.date} ${apt.time}`, 'yyyy-MM-dd HH:mm', new Date())
        const durationMinutes = service?.duration_minutes ?? 30
        const end = new Date(start.getTime() + durationMinutes * 60000)
        return {
          id: apt.id,
          title: `${apt.customer_name} ${apt.customer_last_name} · ${service?.name ?? apt.service_id}`,
          start,
          end,
          resourceId: apt.professional_id,
          status: apt.status,
          color: appointmentAccentColor(apt, service),
          appointment: apt,
        }
      })
  }, [appointments, resources, tenant.services])

  function eventPropGetter(event) {
    return {
      style: {
        backgroundColor: event.color,
        borderColor: 'transparent',
        color: '#fff',
        opacity: isClosedStatus(event.status) ? 0.6 : 1,
      },
    }
  }

  async function handleEventDrop({ event, start, resourceId }) {
    setError(null)
    try {
      await api.updateAppointment(tenant.slug, event.id, {
        professional_id: resourceId ?? event.resourceId,
        date: format(start, 'yyyy-MM-dd'),
        time: format(start, 'HH:mm'),
      })
      const refreshed = await api.getAgenda(tenant.slug, dateStr)
      setAppointments(refreshed)
    } catch (err) {
      setError(err.message)
    }
  }

  async function handleStatusChange(status) {
    if (!selectedEvent) return
    try {
      await api.updateAppointment(tenant.slug, selectedEvent.id, { status })
      const refreshed = await api.getAgenda(tenant.slug, dateStr)
      setAppointments(refreshed)
      setSelectedEvent(null)
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <h1 className="text-2xl font-bold text-ink">Agenda completa</h1>
        <div className="flex flex-wrap items-center gap-4">
          <label className="mb-0 flex flex-col gap-1 text-xs font-bold uppercase tracking-wider text-muted">
            Barbero
            <select
              className="rounded-xl border border-line bg-surface px-3 py-2.5 text-sm text-ink outline-none focus:border-accent transition-colors"
              value={professionalFilter}
              onChange={(e) => setProfessionalFilter(e.target.value)}
            >
              <option value="all">Ver todos los barberos</option>
              {tenant.professionals
                .filter((p) => p.active)
                .map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
            </select>
          </label>
          <button
            type="button"
            className="rounded-xl border border-line px-3 py-2 text-sm font-semibold text-muted hover:border-accent/40 hover:text-ink transition-colors"
            onClick={() => refreshTenant()}
          >
            Refrescar equipo
          </button>
        </div>
      </div>

      {error && <p className="mb-4 text-sm text-red-400">{error}</p>}

      {/* Shared date navigation — same strip as the client booking wizard's step 3. */}
      <div className="mb-4">
        <DateStrip
          dates={DATE_STRIP}
          selectedDate={dateStr}
          onSelect={(iso) => setSelectedDate(parse(iso, 'yyyy-MM-dd', new Date()))}
        />
      </div>

      {/* Desktop: multi-barber drag-and-drop resource grid. */}
      <div className="hidden rounded-2xl border border-line bg-surface p-4 md:block">
        <DnDCalendar
          localizer={localizer}
          culture="es"
          date={selectedDate}
          onNavigate={setSelectedDate}
          toolbar={false}
          defaultView={Views.DAY}
          views={[Views.DAY]}
          resources={resources}
          resourceIdAccessor="id"
          resourceTitleAccessor="name"
          events={events}
          startAccessor="start"
          endAccessor="end"
          min={min}
          max={max}
          step={30}
          timeslots={1}
          eventPropGetter={eventPropGetter}
          onEventDrop={handleEventDrop}
          onSelectEvent={setSelectedEvent}
          resizable={false}
          style={{ height: 640 }}
        />
        {resources.length === 0 && (
          <p>No hay barberos activos {professionalFilter === 'all' ? '' : 'con ese filtro'} para mostrar.</p>
        )}
      </div>

      {/* Mobile: week-ahead list. Citas and free-time gaps are kept in separate tabs
          instead of interleaved — mixing them got visually noisy with several
          barbers' gaps landing on the same day. */}
      <div className="md:hidden">
        <div className="mb-4 inline-flex rounded-xl border border-line bg-surface-alt p-1">
          <button
            type="button"
            onClick={() => setMobileMode('citas')}
            className={`rounded-lg px-4 py-1.5 text-sm font-semibold transition-colors ${
              mobileMode === 'citas' ? 'bg-accent text-[#0C0B09]' : 'text-muted hover:text-ink'
            }`}
          >
            Citas
          </button>
          <button
            type="button"
            onClick={() => setMobileMode('disponibilidad')}
            className={`rounded-lg px-4 py-1.5 text-sm font-semibold transition-colors ${
              mobileMode === 'disponibilidad' ? 'bg-accent text-[#0C0B09]' : 'text-muted hover:text-ink'
            }`}
          >
            Disponibilidad
          </button>
        </div>

        <AgendaListView
          tenantSlug={tenant.slug}
          professionals={tenant.professionals}
          services={tenant.services}
          professionalFilter={professionalFilter}
          onSelectEvent={setSelectedEvent}
          mode={mobileMode}
          startDate={selectedDate}
        />
      </div>

      {selectedEvent && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setSelectedEvent(null)}
        >
          <div className="w-full max-w-sm rounded-2xl border border-line bg-surface-alt p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-ink">
                {selectedEvent.appointment.customer_name} {selectedEvent.appointment.customer_last_name}
              </h3>
              <button type="button" className="text-xl leading-none text-muted hover:text-ink transition-colors" onClick={() => setSelectedEvent(null)}>×</button>
            </div>
            <div className="rounded-xl border border-line bg-paper p-4 mb-4">
              <p className="text-sm text-muted">{selectedEvent.title}</p>
              <p className="text-sm text-muted">{selectedEvent.appointment.date} · {selectedEvent.appointment.time}</p>
              <p className="text-sm text-muted">Tel: {selectedEvent.appointment.customer_phone}</p>
              <p className="mt-2 text-xs font-semibold text-accent">Estado: {STATUS_LABELS[selectedEvent.status] ?? 'En pie'}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" className="flex-1 rounded-xl bg-[#10B981]/15 border border-[#10B981]/20 py-2.5 text-sm font-semibold text-[#10B981] hover:bg-[#10B981]/25 transition-colors" onClick={() => handleStatusChange('completed')}>Completada</button>
              <button type="button" className="flex-1 rounded-xl bg-red-500/10 border border-red-500/20 py-2.5 text-sm font-semibold text-red-400 hover:bg-red-500/20 transition-colors" onClick={() => handleStatusChange('no_show')}>Inasistencia</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

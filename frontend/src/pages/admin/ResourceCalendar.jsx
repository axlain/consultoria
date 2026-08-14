import { useEffect, useMemo, useState } from 'react'
import { Calendar, Views, dateFnsLocalizer } from 'react-big-calendar'
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop'
import { format, getDay, parse, startOfWeek } from 'date-fns'
import { es } from 'date-fns/locale'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css'
import { useTenant } from '../../context/TenantContext'
import { api } from '../../api/client'

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { locale: es }),
  getDay,
  locales: { es },
})

const DnDCalendar = withDragAndDrop(Calendar)

const STATUS_LABELS = {
  scheduled: 'Agendada',
  confirmed: 'Confirmada',
  completed: 'Completada',
  no_show: 'Inasistencia',
}

const STATUS_COLORS = {
  scheduled: '#f1c40f',
  confirmed: '#2f9e44',
  completed: '#868e96',
  no_show: '#e03131',
}

function toMinutes(hhmm) {
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + m
}

function minutesToDate(minutes) {
  return new Date(0, 0, 0, Math.floor(minutes / 60), minutes % 60)
}

function todayIso() {
  return format(new Date(), 'yyyy-MM-dd')
}

// RF06 evolved: resource grid — columns per active barber, rows per time block,
// color-coded by status, with drag & drop to reschedule.
export function ResourceCalendar() {
  const { tenant, refreshTenant } = useTenant()
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [professionalFilter, setProfessionalFilter] = useState('all')
  const [appointments, setAppointments] = useState([])
  const [error, setError] = useState(null)
  const [selectedEvent, setSelectedEvent] = useState(null)

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
          title: `${apt.customer_name} · ${service?.name ?? apt.service_id}`,
          start,
          end,
          resourceId: apt.professional_id,
          status: apt.status,
          appointment: apt,
        }
      })
  }, [appointments, resources, tenant.services])

  function eventPropGetter(event) {
    return {
      style: {
        backgroundColor: STATUS_COLORS[event.status] ?? '#4c6ef5',
        borderColor: 'transparent',
        color: '#fff',
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
      <div className="admin-page-header">
        <h1>Agenda completa</h1>
        <div className="admin-toolbar">
          <label>
            Barbero
            <select value={professionalFilter} onChange={(e) => setProfessionalFilter(e.target.value)}>
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
          <button type="button" className="link-button" onClick={() => refreshTenant()}>
            Refrescar equipo
          </button>
        </div>
      </div>

      <div className="calendar-legend">
        {Object.entries(STATUS_LABELS).map(([key, label]) => (
          <span key={key} className="legend-item">
            <span className="legend-dot" style={{ backgroundColor: STATUS_COLORS[key] }} />
            {label}
          </span>
        ))}
      </div>

      {error && <p className="form-error">{error}</p>}

      <div className="resource-calendar">
        <DnDCalendar
          localizer={localizer}
          culture="es"
          date={selectedDate}
          onNavigate={setSelectedDate}
          defaultView={Views.DAY}
          views={[Views.DAY]}
          toolbar
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
      </div>

      {resources.length === 0 && (
        <p>No hay barberos activos {professionalFilter === 'all' ? '' : 'con ese filtro'} para mostrar.</p>
      )}

      {selectedEvent && (
        <div className="event-popover-backdrop" onClick={() => setSelectedEvent(null)}>
          <div className="event-popover" onClick={(e) => e.stopPropagation()}>
            <h3>{selectedEvent.appointment.customer_name}</h3>
            <p>{selectedEvent.title}</p>
            <p>
              {selectedEvent.appointment.date} · {selectedEvent.appointment.time}
            </p>
            <p>Tel: {selectedEvent.appointment.customer_phone}</p>
            <p>Estado actual: {STATUS_LABELS[selectedEvent.status]}</p>
            <div className="event-popover-actions">
              <button type="button" onClick={() => handleStatusChange('confirmed')}>
                Confirmar
              </button>
              <button type="button" onClick={() => handleStatusChange('completed')}>
                Completada
              </button>
              <button type="button" onClick={() => handleStatusChange('no_show')}>
                Inasistencia
              </button>
              <button type="button" className="link-button" onClick={() => setSelectedEvent(null)}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

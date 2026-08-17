// Only the two closing states get an explicit label — an appointment with no
// closing status yet is just "on", nothing to call out.
export const STATUS_LABELS = {
  completed: 'Completada',
  no_show: 'Inasistencia',
}

const CLOSED_COLORS = {
  completed: '#868e96',
  no_show: '#e03131',
}

// Upcoming appointments are colored by their service (so the barber can tell the
// job type at a glance); closed ones (completed/no_show) fall back to a fixed
// neutral/warning color instead, since there's no more upcoming work to flag.
export function appointmentAccentColor(appointment, service) {
  return CLOSED_COLORS[appointment.status] ?? service?.color ?? '#4c6ef5'
}

export function isClosedStatus(status) {
  return status === 'completed' || status === 'no_show'
}

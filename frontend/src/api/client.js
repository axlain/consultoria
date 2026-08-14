const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8000'

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  })

  if (!response.ok) {
    const body = await response.json().catch(() => ({}))
    const error = new Error(body.detail || `Error ${response.status}`)
    error.status = response.status
    throw error
  }

  if (response.status === 204) return null
  return response.json()
}

export const api = {
  getTenant: (slug) => request(`/api/tenants/${slug}`),

  getAvailability: (slug, professionalId, date) =>
    request(
      `/api/tenants/${slug}/availability?professional_id=${encodeURIComponent(professionalId)}&date=${encodeURIComponent(date)}`,
    ),

  createAppointment: (slug, booking) =>
    request(`/api/tenants/${slug}/appointments`, {
      method: 'POST',
      body: JSON.stringify(booking),
    }),

  getAgenda: (slug, date) =>
    request(`/api/tenants/${slug}/admin/appointments${date ? `?date=${encodeURIComponent(date)}` : ''}`),

  // patch can include status, and/or professional_id/date/time to reschedule.
  updateAppointment: (slug, appointmentId, patch) =>
    request(`/api/tenants/${slug}/admin/appointments/${appointmentId}`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    }),

  createService: (slug, service) =>
    request(`/api/tenants/${slug}/admin/services`, {
      method: 'POST',
      body: JSON.stringify(service),
    }),

  updateService: (slug, serviceId, patch) =>
    request(`/api/tenants/${slug}/admin/services/${serviceId}`, {
      method: 'PUT',
      body: JSON.stringify(patch),
    }),

  deleteService: (slug, serviceId) =>
    request(`/api/tenants/${slug}/admin/services/${serviceId}`, { method: 'DELETE' }),

  createProfessional: (slug, professional) =>
    request(`/api/tenants/${slug}/admin/professionals`, {
      method: 'POST',
      body: JSON.stringify(professional),
    }),

  updateProfessional: (slug, professionalId, patch) =>
    request(`/api/tenants/${slug}/admin/professionals/${professionalId}`, {
      method: 'PUT',
      body: JSON.stringify(patch),
    }),

  deleteProfessional: (slug, professionalId) =>
    request(`/api/tenants/${slug}/admin/professionals/${professionalId}`, { method: 'DELETE' }),
}

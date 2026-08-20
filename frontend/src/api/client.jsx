const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8000'

function _authHeader() {
  try {
    const raw = localStorage.getItem('auth_session')
    if (raw) {
      const { token } = JSON.parse(raw)
      if (token) return { Authorization: `Bearer ${token}` }
    }
  } catch { /* ignore */ }
  return {}
}

async function request(path, options = {}) {
  let response
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      headers: { 'Content-Type': 'application/json', ..._authHeader(), ...options.headers },
      ...options,
    })
  } catch {
    // Network-level failure (server down, no connection, CORS) — fetch() throws a raw,
    // browser-specific TypeError here that isn't fit to show a user.
    throw new Error('No se pudo conectar con el servidor. Verifica tu conexión e intenta de nuevo.')
  }

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

  // Full grid of the day's slots (never hides a taken one — tags it `available: false`
  // so the UI can show it disabled instead). Pass serviceId for the wizard's datetime
  // step (aggregates every professional offering that service) or professionalId for a
  // single barber's day (public availability calendar); omit both for "everyone".
  getAvailability: (slug, { date, serviceId, professionalId } = {}) => {
    const params = new URLSearchParams({ date })
    if (serviceId) params.set('service_id', serviceId)
    if (professionalId) params.set('professional_id', professionalId)
    return request(`/api/tenants/${slug}/availability?${params}`)
  },

  getAvailableProfessionals: (slug, { serviceId, date, time }) => {
    const params = new URLSearchParams({ service_id: serviceId, date, time })
    return request(`/api/tenants/${slug}/available-professionals?${params}`)
  },

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

  // Front-desk QR check-in: resolves the scanned id to display-ready appointment details.
  validateAppointment: (slug, appointmentId) =>
    request(`/api/tenants/${slug}/admin/appointments/validate/${encodeURIComponent(appointmentId)}`),

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

  createPayment: ({ appointmentId, businessId, amountCents, currency = 'MXN' }) =>
    request('/api/payments/create', {
      method: 'POST',
      body: JSON.stringify({
        appointment_id: appointmentId,
        business_id: businessId,
        amount_cents: amountCents,
        currency,
      }),
    }),

  confirmPayment: (paymentId) =>
    request('/api/payments/confirm', {
      method: 'POST',
      body: JSON.stringify({ payment_id: paymentId }),
    }),

  refundPayment: (paymentId) =>
    request('/api/payments/refund', {
      method: 'POST',
      body: JSON.stringify({ payment_id: paymentId }),
    }),

  getPayment: (paymentId) => request(`/api/payments/${paymentId}`),

  getProfile: () => request('/api/me/profile'),

  updateProfile: (patch) =>
    request('/api/me/profile', {
      method: 'PATCH',
      body: JSON.stringify(patch),
    }),
}

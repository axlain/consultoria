-- =============================================================================
-- Índices para los patrones de consulta reales del flujo de reservas y pagos.
-- Sin filtro por fecha, cada consulta de disponibilidad escaneaba toda la
-- tabla de citas del tenant; ahora que el backend filtra por (tenant_slug,
-- date), estos índices evitan el table scan a medida que crece el historial.
-- =============================================================================

create index if not exists idx_appointments_tenant_date
  on appointments (tenant_slug, date);

create index if not exists idx_appointments_tenant_client
  on appointments (tenant_slug, client_user_id);

create index if not exists idx_payments_appointment
  on payments (appointment_id);

create index if not exists idx_payments_business
  on payments (business_id);

create index if not exists idx_payment_events_payment
  on payment_events (payment_id);

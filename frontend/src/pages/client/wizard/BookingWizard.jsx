import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTenant } from '../../../context/TenantContext'
import { api } from '../../../api/client'
import { ClientShell } from '../../../components/ClientShell'
import { StepService } from './StepService'
import { StepProfessional } from './StepProfessional'
import { StepDateTime } from './StepDateTime'
import { StepConfirm } from './StepConfirm'

const STEPS = ['service', 'datetime', 'professional', 'confirm']

// RF03: orchestrates the 4-step booking wizard; no account creation required.
// Order is service → datetime → professional so the "cualquier profesional" option
// can be resolved (by the backend, at confirm time) against whoever's free at the
// slot the client already picked, instead of asking them to pick a person first.
export function BookingWizard() {
  const { tenant } = useTenant()
  const navigate = useNavigate()
  const [stepIndex, setStepIndex] = useState(0)
  const [booking, setBooking] = useState({
    service: null,
    professional: null,
    date: '',
    time: '',
    customerName: '',
    customerLastName: '',
    customerPhone: '',
  })
  const [submitError, setSubmitError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const goNext = () => setStepIndex((i) => Math.min(i + 1, STEPS.length - 1))
  const goBack = () => setStepIndex((i) => Math.max(i - 1, 0))
  const updateBooking = (patch) => setBooking((prev) => ({ ...prev, ...patch }))

  async function handleConfirm() {
    setSubmitting(true)
    setSubmitError(null)
    try {
      const appointment = await api.createAppointment(tenant.slug, {
        service_id: booking.service.id,
        professional_id: booking.professional.id,
        date: booking.date,
        time: booking.time,
        customer_name: booking.customerName,
        customer_last_name: booking.customerLastName,
        customer_phone: booking.customerPhone,
      })
      navigate(`/demo/${tenant.slug}/gracias`, { state: { appointment } })
    } catch (err) {
      setSubmitError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const step = STEPS[stepIndex]
  const accent = booking.service?.color || 'var(--color-secondary)'

  return (
    <ClientShell>
      <div className="mb-7">
        <div className="flex gap-1.5" role="progressbar" aria-valuenow={stepIndex + 1} aria-valuemin={1} aria-valuemax={STEPS.length}>
          {STEPS.map((s, i) => (
            <div key={s} className="bg-line h-1 flex-1 overflow-hidden rounded-full">
              <div
                className="h-full rounded-full transition-[width] duration-300 ease-out"
                style={{ width: i <= stepIndex ? '100%' : '0%', backgroundColor: accent }}
              />
            </div>
          ))}
        </div>
        <p className="text-muted mt-2.5 text-center text-xs font-semibold tracking-[0.12em] uppercase">
          Paso {stepIndex + 1} de {STEPS.length}
        </p>
      </div>

      <div key={step} className="motion-safe:animate-fade-in">
        {step === 'service' && (
          <StepService
            services={tenant.services}
            onSelect={(service) => {
              updateBooking({ service, professional: null })
              goNext()
            }}
          />
        )}

        {step === 'datetime' && (
          <StepDateTime
            tenantSlug={tenant.slug}
            serviceId={booking.service.id}
            date={booking.date}
            onChange={(patch) => updateBooking({ ...patch, professional: null })}
            onNext={goNext}
            onBack={goBack}
          />
        )}

        {step === 'professional' && (
          <StepProfessional
            tenantSlug={tenant.slug}
            serviceId={booking.service.id}
            date={booking.date}
            time={booking.time}
            onSelect={(professional) => {
              updateBooking({ professional })
              goNext()
            }}
            onBack={goBack}
          />
        )}

        {step === 'confirm' && (
          <StepConfirm
            booking={booking}
            onChange={updateBooking}
            onBack={goBack}
            onConfirm={handleConfirm}
            submitting={submitting}
            error={submitError}
          />
        )}
      </div>
    </ClientShell>
  )
}

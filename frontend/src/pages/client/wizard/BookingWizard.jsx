import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTenant } from '../../../context/TenantContext'
import { useAuth } from '../../../context/AuthContext'
import { api } from '../../../api/client'
import { ClientShell } from '../../../components/ClientShell'
import { HamburgerMenu } from '../../../components/HamburgerMenu'
import { StepService } from './StepService'
import { StepProfessional } from './StepProfessional'
import { StepDateTime } from './StepDateTime'
import { StepConfirm } from './StepConfirm'
import { StepCheckout } from './StepCheckout'
import { StepPaymentError } from './StepPaymentError'

const STEPS = ['service', 'datetime', 'professional', 'confirm', 'checkout']

// RF03 + RF-Pagos: 5-step wizard — service → datetime → professional → confirm → checkout.
// Confirm creates the appointment; checkout creates + confirms the mock payment, then
// navigates to /gracias with both appointment and payment in router state.
export function BookingWizard() {
  const { tenant } = useTenant()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [stepIndex, setStepIndex] = useState(0)

  // Pre-fill name from auth session if the user is logged in as client.
  function _prefillFromUser() {
    if (!user) return { customerName: '', customerLastName: '' }
    const parts = user.name.trim().split(/\s+/)
    return {
      customerName: parts[0] ?? '',
      customerLastName: parts.slice(1).join(' ') ?? '',
    }
  }

  const [booking, setBooking] = useState({
    service: null,
    professional: null,
    date: '',
    time: '',
    customerPhone: '',
    ..._prefillFromUser(),
  })
  const [appointment, setAppointment] = useState(null)
  const [submitError, setSubmitError] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [paymentFailed, setPaymentFailed] = useState(false)

  const goNext = () => setStepIndex((i) => Math.min(i + 1, STEPS.length - 1))
  const goBack = () => setStepIndex((i) => Math.max(i - 1, 0))
  const updateBooking = (patch) => setBooking((prev) => ({ ...prev, ...patch }))

  // Step 4 — create the appointment, then advance to checkout.
  async function handleConfirm() {
    setSubmitting(true)
    setSubmitError(null)
    try {
      const apt = await api.createAppointment(tenant.slug, {
        service_id: booking.service.id,
        professional_id: booking.professional.id,
        date: booking.date,
        time: booking.time,
        customer_name: booking.customerName,
        customer_last_name: booking.customerLastName,
        customer_phone: booking.customerPhone,
        ...(user ? { client_user_id: user.id } : {}),
      })
      setAppointment(apt)
      goNext()
    } catch (err) {
      setSubmitError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  // Step 5 — create + confirm mock payment, then navigate to /gracias.
  async function handlePaid(amountCents) {
    const { payment_id } = await api.createPayment({
      appointmentId: appointment.id,
      businessId: tenant.slug,
      amountCents,
      currency: 'MXN',
    })
    const confirmed = await api.confirmPayment(payment_id)
    if (confirmed.status !== 'paid') {
      setPaymentFailed(true)
      throw new Error('El pago no pudo completarse.')
    }
    navigate(`/demo/${tenant.slug}/gracias`, {
      state: { appointment, payment: confirmed },
    })
  }

  function handlePaymentError(reason) {
    if (reason === 'canceled') {
      // Appointment already exists — skip payment, go to thank-you anyway.
      navigate(`/demo/${tenant.slug}/gracias`, { state: { appointment, payment: null } })
    } else {
      setPaymentFailed(true)
    }
  }

  const step = STEPS[stepIndex]
  const accent = booking.service?.color || 'var(--color-secondary)'

  // Payment error screen replaces the checkout step.
  if (paymentFailed) {
    return (
      <ClientShell>
        <StepPaymentError
          onRetry={() => setPaymentFailed(false)}
          onCancel={() => navigate(`/demo/${tenant.slug}/gracias`, { state: { appointment, payment: null } })}
        />
      </ClientShell>
    )
  }

  return (
    <ClientShell>
      <HamburgerMenu faqs={tenant.faqs} slug={tenant.slug} />
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

        {step === 'checkout' && appointment && (
          <StepCheckout
            booking={booking}
            appointment={appointment}
            onPaid={handlePaid}
            onError={handlePaymentError}
          />
        )}
      </div>
    </ClientShell>
  )
}

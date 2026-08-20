import { useEffect, useRef, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
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
const CHECKOUT_IDX = STEPS.indexOf('checkout')
const STRIPE_ENABLED = Boolean(import.meta.env.VITE_STRIPE_PK)

export function BookingWizard() {
  const { tenant } = useTenant()
  const { user } = useAuth()
  const navigate = useNavigate()
  const { state: locationState } = useLocation()
  const rebook = locationState?.rebook ?? null

  const [stepIndex, setStepIndex] = useState(rebook ? STEPS.indexOf('datetime') : 0)

  function _prefillFromUser() {
    if (!user) return { customerName: '', customerLastName: '' }
    const parts = user.name.trim().split(/\s+/)
    return { customerName: parts[0] ?? '', customerLastName: parts.slice(1).join(' ') ?? '' }
  }

  const [booking, setBooking] = useState({
    service: rebook?.service ?? null,
    professional: rebook?.professional ?? null,
    date: '',
    time: '',
    customerPhone: rebook?.customerPhone ?? '',
    customerName: rebook?.customerName ?? _prefillFromUser().customerName,
    customerLastName: rebook?.customerLastName ?? _prefillFromUser().customerLastName,
  })
  const [appointment, setAppointment] = useState(null)
  const [paymentId, setPaymentId] = useState(null)
  const [clientSecret, setClientSecret] = useState(null)
  const [submitError, setSubmitError] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [paymentFailed, setPaymentFailed] = useState(false)

  // Captures date+time from StepDateTime synchronously before onNext fires in rebook mode.
  const _rebookSlot = useRef({ date: '', time: '' })

  // Pre-fill phone from saved profile.
  useEffect(() => {
    if (!user || rebook?.customerPhone) return
    api.getProfile()
      .then(profile => { if (profile?.phone) updateBooking({ customerPhone: profile.phone }) })
      .catch(() => {})
  }, [user?.id])

  const goNext = () => setStepIndex((i) => Math.min(i + 1, STEPS.length - 1))
  const goBack = () => setStepIndex((i) => Math.max(i - 1, 0))
  const updateBooking = (patch) => setBooking((prev) => ({ ...prev, ...patch }))

  // Creates the PaymentIntent immediately after appointment creation so
  // Stripe Elements (incl. Apple Pay / Google Pay) mount right away on step 5.
  async function _initStripePayment(apt, service) {
    if (!STRIPE_ENABLED) return
    try {
      const data = await api.createPayment({
        appointmentId: apt.id,
        businessId: tenant.slug,
        amountCents: Math.round(service.price * 100),
        currency: 'MXN',
      })
      if (data.client_secret) {
        setClientSecret(data.client_secret)
        setPaymentId(data.payment_id)
      }
    } catch (_) { /* falls back to mock mode */ }
  }

  // Step 4 (normal flow) — creates appointment, init Stripe, advance to checkout.
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
      if (user && booking.customerPhone) {
        api.updateProfile({ phone: booking.customerPhone }).catch(() => {})
      }
      await _initStripePayment(apt, booking.service)
      goNext()
    } catch (err) {
      setSubmitError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  // Rebook mode — triggered after slot selection in StepDateTime.
  // Uses _rebookSlot ref set synchronously in onChange before this fires.
  async function handleRebookSlotNext() {
    const { date, time } = _rebookSlot.current
    setSubmitting(true)
    setSubmitError(null)
    try {
      const apt = await api.createAppointment(tenant.slug, {
        service_id: rebook.service.id,
        professional_id: rebook.professional?.id || 'any',
        date,
        time,
        customer_name: booking.customerName,
        customer_last_name: booking.customerLastName,
        customer_phone: booking.customerPhone,
        ...(user ? { client_user_id: user.id } : {}),
      })
      setAppointment(apt)
      await _initStripePayment(apt, rebook.service)
      setStepIndex(CHECKOUT_IDX)
    } catch (err) {
      setSubmitError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  // Step 5 — confirm payment and navigate to /gracias.
  // In Stripe mode the PaymentIntent was already created and confirmed on the
  // frontend by Stripe Elements; here we just update our DB status.
  // In mock mode we create + confirm the payment in one shot.
  async function handlePaid(amountCents) {
    let pid = paymentId
    if (!pid) {
      // Mock mode: create payment now.
      const data = await api.createPayment({
        appointmentId: appointment.id,
        businessId: tenant.slug,
        amountCents,
        currency: 'MXN',
      })
      pid = data.payment_id
    }
    const confirmed = await api.confirmPayment(pid)
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
      navigate(`/demo/${tenant.slug}/gracias`, { state: { appointment, payment: null } })
    } else {
      setPaymentFailed(true)
    }
  }

  const step = STEPS[stepIndex]
  const accent = booking.service?.color || 'var(--color-secondary)'

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
        <div className="flex gap-1.5 pr-14" role="progressbar" aria-valuenow={stepIndex + 1} aria-valuemin={1} aria-valuemax={STEPS.length}>
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
          {rebook ? 'Reagendar — elige nueva fecha' : `Paso ${stepIndex + 1} de ${STEPS.length}`}
        </p>
      </div>

      {submitError && (
        <p className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{submitError}</p>
      )}

      {submitting && (
        <p className="mb-4 text-center text-sm text-[#6e6e73]">Procesando…</p>
      )}

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
            onChange={(patch) => {
              updateBooking(rebook ? patch : { ...patch, professional: null })
              if (rebook && patch.time) _rebookSlot.current = patch
            }}
            onNext={rebook ? handleRebookSlotNext : goNext}
            onBack={rebook ? () => navigate(-1) : goBack}
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
            clientSecret={clientSecret}
          />
        )}
      </div>
    </ClientShell>
  )
}

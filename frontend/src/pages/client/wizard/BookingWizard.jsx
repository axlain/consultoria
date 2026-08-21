import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
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

// The official 5 steps — always what the progress indicator counts against,
// regardless of which ones a given session actually has to render. A step
// skipped via preselected data still "happened" (it's pre-filled), so the
// indicator shows it as done rather than shrinking the total.
const CANONICAL_STEPS = ['service', 'datetime', 'professional', 'confirm', 'checkout']
const STRIPE_ENABLED = Boolean(import.meta.env.VITE_STRIPE_PK)

export function BookingWizard() {
  const { tenant } = useTenant()
  const { user } = useAuth()
  const navigate = useNavigate()
  const { state: locationState } = useLocation()
  const rebook = locationState?.rebook ?? null
  // Carried over from the "Ver disponibilidad" page: a date+time (both
  // mandatory there) and, if the client had a specific barber selected
  // rather than "todos los profesionales", that professional too.
  const preselect = locationState?.preselect ?? null
  const preselectedProfessional = preselect?.professionalId
    ? tenant.professionals.find((p) => p.id === preselect.professionalId) ?? null
    : null
  // Date+time already chosen means step 2 has nothing left to ask; a
  // professional locked in before the client even picks a service means
  // step 3 doesn't either. Narrow step 1 to only the services that
  // professional actually offers when they're locked in.
  const skipDatetimeStep = Boolean(preselect?.date && preselect?.time)
  const skipProfessionalStep = Boolean(preselectedProfessional)

  const STEPS = CANONICAL_STEPS.filter((s) => {
    if (s === 'datetime') return !skipDatetimeStep
    if (s === 'professional') return !skipProfessionalStep
    return true
  })
  const CHECKOUT_IDX = STEPS.indexOf('checkout')

  const [stepIndex, setStepIndex] = useState(rebook ? STEPS.indexOf('datetime') : 0)

  function _prefillFromUser() {
    if (!user) return { customerName: '', customerLastName: '' }
    const parts = user.name.trim().split(/\s+/)
    return { customerName: parts[0] ?? '', customerLastName: parts.slice(1).join(' ') ?? '' }
  }

  const [booking, setBooking] = useState({
    service: rebook?.service ?? null,
    professional: rebook?.professional ?? preselectedProfessional,
    date: preselect?.date ?? '',
    time: preselect?.time ?? '',
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
    } catch { /* falls back to mock mode */ }
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
      // "Cualquier profesional" is a placeholder until the backend actually
      // assigns someone — swap it for the real name so the summary/checkout
      // tell the client exactly who they're booked with.
      const assignedProfessional = tenant.professionals.find((p) => p.id === apt.professional_id)
      if (assignedProfessional) updateBooking({ professional: assignedProfessional })
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
      const assignedProfessional = tenant.professionals.find((p) => p.id === apt.professional_id)
      if (assignedProfessional) updateBooking({ professional: assignedProfessional })
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

  // Step 5 "Cancelar" — the client is backing out before paying, not confirming
  // anything, so the reserved appointment must be released rather than left
  // sitting in the DB looking like a real booking (it must never land on the
  // "¡Cita confirmada!" screen).
  function handlePaymentError(reason) {
    if (reason === 'canceled') {
      if (appointment) {
        api.cancelAppointment(tenant.slug, appointment.id).catch(() => {})
      }
      navigate(`/demo/${tenant.slug}`)
    } else {
      setPaymentFailed(true)
    }
  }

  const step = STEPS[stepIndex]
  // Where this step sits in the *official* 5-step sequence — what the
  // progress indicator always counts against, independent of which steps
  // this session actually renders.
  const currentCanonicalIndex = CANONICAL_STEPS.indexOf(step)
  if (paymentFailed) {
    return (
      <ClientShell wide>
        <StepPaymentError
          onRetry={() => setPaymentFailed(false)}
          onCancel={() => navigate(`/demo/${tenant.slug}/gracias`, { state: { appointment, payment: null } })}
        />
      </ClientShell>
    )
  }

  return (
    <ClientShell wide>
      <HamburgerMenu faqs={tenant.faqs} slug={tenant.slug} className="lg:hidden" />
      {/* X — volver al home del tenant (mobile/tablet) */}
      <Link
        to={`/demo/${tenant.slug}`}
        className="absolute top-4 left-4 z-10 flex h-9 w-9 items-center justify-center rounded-xl border border-line bg-surface/80 text-muted no-underline backdrop-blur-sm transition-colors hover:border-accent/40 hover:text-ink lg:hidden"
        aria-label="Cerrar y volver al inicio"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </Link>

      {/* Shared card: contains both columns on every step so nothing floats loose on desktop. */}
      <div className="lg:mx-auto lg:max-w-4xl lg:my-12 lg:rounded-3xl lg:border lg:border-line lg:bg-surface lg:overflow-hidden">
      {/* Unified header bar (desktop): keeps close + menu controls anchored to the card instead of floating loose. */}
      <div className="hidden lg:flex lg:items-center lg:justify-between lg:border-b lg:border-line lg:px-8 lg:py-5">
        <Link
          to={`/demo/${tenant.slug}`}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-line bg-surface-alt text-muted no-underline transition-colors hover:border-accent/40 hover:text-ink"
          aria-label="Cerrar y volver al inicio"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </Link>
        <HamburgerMenu faqs={tenant.faqs} slug={tenant.slug} inline />
      </div>
      <div className="lg:flex lg:items-stretch">
      {/* Body: `.wizard-step-scroll` (see index.css) makes the container itself the
          mobile scroll owner — min-height (never a hard cap) + overflow-y:auto — so
          touch-scroll always has somewhere to go and never gets trapped. The CTA bars
          are `fixed`/portaled, so they stay reachable regardless of how tall this
          content grows. */}
      <div className="wizard-step-scroll md:max-w-2xl md:mx-auto lg:max-w-none lg:mx-0 lg:flex-1 lg:min-w-0 lg:p-10">
      <div className="mb-7 px-5 pt-10 lg:px-0 lg:pt-0">
        {rebook ? (
          <p className="text-center text-[10px] font-bold tracking-[0.14em] uppercase text-muted">
            Reagendar — elige nueva fecha
          </p>
        ) : (
          <div role="progressbar" aria-valuenow={currentCanonicalIndex + 1} aria-valuemin={1} aria-valuemax={CANONICAL_STEPS.length}
            className="flex items-center justify-center pr-10">
            {CANONICAL_STEPS.map((s, i) => {
              // A step this session never renders (pre-filled via preselect) still
              // counts as "done" — only steps genuinely still ahead look pending.
              const isDone = !STEPS.includes(s) || i < currentCanonicalIndex
              const isCurrent = s === step
              return (
                <div key={s} className="flex items-center">
                  <div className={[
                    'w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold transition-all duration-200',
                    isDone ? 'bg-accent text-[#0C0B09]' :
                    isCurrent ? 'bg-accent text-[#0C0B09] ring-2 ring-accent/30 ring-offset-2 ring-offset-paper' :
                    'bg-line text-muted',
                  ].join(' ')}>
                    {isDone ? (
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                    ) : i + 1}
                  </div>
                  {i < CANONICAL_STEPS.length - 1 && (
                    <div className={`h-px w-6 mx-0.5 transition-colors duration-200 ${isDone ? 'bg-accent' : 'bg-line'}`} />
                  )}
                </div>
              )
            })}
          </div>
        )}
        <p className="mt-2.5 text-center text-[10px] font-bold tracking-[0.14em] uppercase text-muted">
          {rebook ? '' : `Paso ${currentCanonicalIndex + 1} de ${CANONICAL_STEPS.length}`}
        </p>
      </div>

      <div className="px-5 pb-12 lg:px-0 lg:pb-0">
      {submitError && (
        <p className="mb-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">{submitError}</p>
      )}

      {submitting && (
        <p className="mb-4 text-center text-sm text-[#888]">Procesando…</p>
      )}

      <div key={step} className="motion-safe:animate-fade-in">
        {step === 'service' && (
          <StepService
            services={
              skipProfessionalStep
                ? tenant.services.filter((s) => preselectedProfessional.service_ids.includes(s.id))
                : tenant.services
            }
            onSelect={(service) => {
              updateBooking({ service, professional: skipProfessionalStep ? booking.professional : null })
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
              updateBooking((rebook || skipProfessionalStep) ? patch : { ...patch, professional: null })
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
      </div>
      </div>

      {/* Live booking summary — desktop only, right column of the shared card */}
      <aside className="hidden lg:flex lg:flex-col lg:w-80 lg:shrink-0 lg:border-l lg:border-line lg:p-10">
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted mb-4">
          {rebook ? 'Reagendar cita' : 'Resumen de tu cita'}
        </p>
        <dl className="flex flex-col gap-3 text-sm">
          <div className="flex items-center justify-between gap-3">
            <dt className="text-muted">Servicio</dt>
            <dd className="m-0 text-right font-medium text-ink">{booking.service?.name || 'Por elegir'}</dd>
          </div>
          <div className="flex items-center justify-between gap-3">
            <dt className="text-muted">Profesional</dt>
            <dd className="m-0 text-right font-medium text-ink">{booking.professional?.name || 'Por elegir'}</dd>
          </div>
          <div className="flex items-center justify-between gap-3">
            <dt className="text-muted">Fecha</dt>
            <dd className="m-0 text-right font-medium text-ink">{booking.date || 'Por elegir'}</dd>
          </div>
          <div className="flex items-center justify-between gap-3">
            <dt className="text-muted">Hora</dt>
            <dd className="m-0 text-right font-medium text-ink">{booking.time || 'Por elegir'}</dd>
          </div>
        </dl>
        {booking.service && (
          <div className="mt-4 flex items-center justify-between border-t border-line pt-4">
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted">Total</span>
            <span className="text-xl font-extrabold text-accent">${booking.service.price}</span>
          </div>
        )}
      </aside>
      </div>
      </div>
    </ClientShell>
  )
}

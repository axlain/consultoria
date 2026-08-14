import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTenant } from '../../../context/TenantContext'
import { api } from '../../../api/client'
import { StepService } from './StepService'
import { StepProfessional } from './StepProfessional'
import { StepDateTime } from './StepDateTime'
import { StepConfirm } from './StepConfirm'

const STEPS = ['service', 'professional', 'datetime', 'confirm']

// RF03: orchestrates the 4-step booking wizard; no account creation required.
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
    customerPhone: '',
    tattooDetails: null,
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
      await api.createAppointment(tenant.slug, {
        service_id: booking.service.id,
        professional_id: booking.professional.id,
        date: booking.date,
        time: booking.time,
        customer_name: booking.customerName,
        customer_phone: booking.customerPhone,
        tattoo_details: booking.tattooDetails,
      })
      navigate(`/demo/${tenant.slug}/gracias`)
    } catch (err) {
      setSubmitError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const step = STEPS[stepIndex]

  return (
    <div className="client-shell">
      <p className="wizard-progress">
        Paso {stepIndex + 1} de {STEPS.length}
      </p>

      {step === 'service' && (
        <StepService
          services={tenant.services}
          onSelect={(service) => {
            updateBooking({ service, professional: null })
            goNext()
          }}
        />
      )}

      {step === 'professional' && (
        <StepProfessional
          professionals={tenant.professionals.filter((p) => p.service_ids.includes(booking.service.id))}
          onSelect={(professional) => {
            updateBooking({ professional })
            goNext()
          }}
          onBack={goBack}
        />
      )}

      {step === 'datetime' && (
        <StepDateTime
          tenantSlug={tenant.slug}
          professional={booking.professional}
          date={booking.date}
          onChange={updateBooking}
          onNext={goNext}
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
  )
}

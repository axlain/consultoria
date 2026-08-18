import { useState } from 'react'

// ── Formatting helpers ────────────────────────────────────────────────────────

function fmtCardNumber(raw) {
  return raw.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim()
}

function fmtExpiry(raw) {
  const digits = raw.replace(/\D/g, '').slice(0, 4)
  if (digits.length <= 2) return digits
  return digits.slice(0, 2) + '/' + digits.slice(2)
}

// ── Validation helpers ────────────────────────────────────────────────────────

const isHolderValid  = (v) => /^[A-Za-zÀ-ÿ\s]{2,}$/.test(v.trim())
const isCardValid    = (v) => v.replace(/\s/g, '').length === 16
const isCvvValid     = (v) => /^\d{3,4}$/.test(v)

function isExpiryValid(v) {
  if (!/^\d{2}\/\d{2}$/.test(v)) return false
  const [mm, yy] = v.split('/').map(Number)
  if (mm < 1 || mm > 12) return false
  const now      = new Date()
  const expYear  = 2000 + yy
  const curYear  = now.getFullYear()
  const curMonth = now.getMonth() + 1
  if (expYear < curYear) return false
  if (expYear === curYear && mm < curMonth) return false
  return true
}

// ── Component ─────────────────────────────────────────────────────────────────

// RF-Pagos step 5: cosmetic card form. Card data is never sent to the server.
export function StepCheckout({ booking, appointment, onPaid, onError }) {
  const [holder,  setHolder]  = useState('')
  const [card,    setCard]    = useState('')
  const [expiry,  setExpiry]  = useState('')
  const [cvv,     setCvv]     = useState('')
  const [touched, setTouched] = useState({})
  const [paying,  setPaying]  = useState(false)
  const [apiError, setApiError] = useState(null)

  const amountCents = Math.round(booking.service.price * 100)
  const formatted   = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' })
    .format(booking.service.price)

  const valid = {
    holder: isHolderValid(holder),
    card:   isCardValid(card),
    expiry: isExpiryValid(expiry),
    cvv:    isCvvValid(cvv),
  }
  const canPay = Object.values(valid).every(Boolean) && !paying

  function touch(field) {
    setTouched((t) => ({ ...t, [field]: true }))
  }

  function showError(field) {
    return touched[field] && !valid[field]
  }

  // Base class + conditional error ring
  function inputClass(field) {
    return [
      'rounded-lg border p-[0.6rem] text-base w-full transition-colors',
      showError(field)
        ? 'border-[#c0392b] focus-visible:border-[#c0392b]'
        : 'border-line focus-visible:border-secondary',
    ].join(' ')
  }

  // ── Handlers ────────────────────────────────────────────────────────────────

  function handleCard(e) {
    setCard(fmtCardNumber(e.target.value))
  }

  function handleExpiry(e) {
    const prev = expiry
    const next = fmtExpiry(e.target.value)
    // Allow deleting the slash naturally
    if (prev.endsWith('/') && e.target.value.length < prev.length) {
      setExpiry(e.target.value.replace(/\D/g, '').slice(0, 2))
    } else {
      setExpiry(next)
    }
  }

  function handleCvv(e) {
    setCvv(e.target.value.replace(/\D/g, '').slice(0, 4))
  }

  async function handlePay() {
    // Mark all fields touched so errors show before submitting
    setTouched({ holder: true, card: true, expiry: true, cvv: true })
    if (!canPay) return
    setPaying(true)
    setApiError(null)
    try {
      await onPaid(amountCents)
    } catch (err) {
      setApiError(err.message)
      setPaying(false)
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <section>
      <h2>Pago de tu cita</h2>

      {/* Order summary */}
      <div className="border-line mb-6 rounded-xl border bg-white p-4">
        <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-2 text-sm">
          <dt className="text-muted">Servicio</dt>
          <dd className="m-0 text-right font-medium">{booking.service.name}</dd>
          <dt className="text-muted">Cita #</dt>
          <dd className="m-0 text-right font-mono text-xs">{appointment.id}</dd>
        </dl>
        <div className="border-line mt-3 flex items-center justify-between border-t pt-3">
          <span className="text-muted text-xs font-semibold tracking-wide uppercase">Total</span>
          <span className="text-lg font-bold" style={{ color: booking.service.color }}>
            {formatted}
          </span>
        </div>
      </div>

      {/* Card form */}
      <fieldset className="mb-4 rounded-xl border border-[#e2e8f0] p-4" disabled={paying}>
        <legend className="text-muted px-1 text-xs font-semibold uppercase tracking-wide">
          Datos de tarjeta (simulado)
        </legend>

        {/* Card holder */}
        <div className="mb-3">
          <label className="flex flex-col gap-1.5 text-sm font-medium">
            Nombre en la tarjeta
            <input
              type="text"
              autoComplete="cc-name"
              placeholder="Ej. Juan Pérez"
              className={inputClass('holder')}
              value={holder}
              onChange={(e) => setHolder(e.target.value.replace(/[^A-Za-zÀ-ÿ\s]/g, ''))}
              onBlur={() => touch('holder')}
            />
          </label>
          {showError('holder') && (
            <p className="mt-1 text-xs text-[#c0392b]">Ingresa el nombre tal como aparece en la tarjeta.</p>
          )}
        </div>

        {/* Card number */}
        <div className="mb-3">
          <label className="flex flex-col gap-1.5 text-sm font-medium">
            Número de tarjeta
            <input
              type="text"
              inputMode="numeric"
              autoComplete="cc-number"
              placeholder="1234 5678 9012 3456"
              maxLength={19}
              className={inputClass('card')}
              value={card}
              onChange={handleCard}
              onBlur={() => touch('card')}
            />
          </label>
          {showError('card') && (
            <p className="mt-1 text-xs text-[#c0392b]">Ingresa los 16 dígitos de tu tarjeta.</p>
          )}
        </div>

        {/* Expiry + CVV */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="flex flex-col gap-1.5 text-sm font-medium">
              Vencimiento
              <input
                type="text"
                inputMode="numeric"
                autoComplete="cc-exp"
                placeholder="MM/AA"
                maxLength={5}
                className={inputClass('expiry')}
                value={expiry}
                onChange={handleExpiry}
                onBlur={() => touch('expiry')}
              />
            </label>
            {showError('expiry') && (
              <p className="mt-1 text-xs text-[#c0392b]">Fecha inválida o vencida.</p>
            )}
          </div>

          <div>
            <label className="flex flex-col gap-1.5 text-sm font-medium">
              CVV
              <input
                type="password"
                inputMode="numeric"
                autoComplete="cc-csc"
                placeholder="•••"
                maxLength={4}
                className={inputClass('cvv')}
                value={cvv}
                onChange={handleCvv}
                onBlur={() => touch('cvv')}
              />
            </label>
            {showError('cvv') && (
              <p className="mt-1 text-xs text-[#c0392b]">CVV inválido (3 o 4 dígitos).</p>
            )}
          </div>
        </div>

        <p className="text-muted mt-3 text-xs">
          Entorno de prueba — ningún dato de tarjeta es procesado ni almacenado.
        </p>
      </fieldset>

      {apiError && <p className="mb-4 text-sm text-[#c0392b]">{apiError}</p>}

      <button
        type="button"
        className="bg-secondary w-full rounded-full px-6 py-3 text-sm font-semibold text-white transition-transform duration-150 hover:scale-[1.02] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
        onClick={handlePay}
        disabled={!canPay}
      >
        {paying ? 'Procesando pago...' : `Pagar ${formatted}`}
      </button>

      <button
        type="button"
        onClick={() => onError('canceled')}
        className="text-muted mt-3 w-full border-0 bg-transparent text-sm underline"
        disabled={paying}
      >
        Cancelar
      </button>
    </section>
  )
}

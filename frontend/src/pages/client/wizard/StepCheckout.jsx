import { useState } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'

const _STRIPE_PK = import.meta.env.VITE_STRIPE_PK
const _stripePromise = _STRIPE_PK ? loadStripe(_STRIPE_PK) : null

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

const isHolderValid = (v) => /^[A-Za-zÀ-ÿ\s]{2,}$/.test(v.trim())
const isCardValid   = (v) => v.replace(/\s/g, '').length === 16
const isCvvValid    = (v) => /^\d{3,4}$/.test(v)

function isExpiryValid(v) {
  if (!/^\d{2}\/\d{2}$/.test(v)) return false
  const [mm, yy] = v.split('/').map(Number)
  if (mm < 1 || mm > 12) return false
  const now = new Date()
  const expYear = 2000 + yy
  if (expYear < now.getFullYear()) return false
  if (expYear === now.getFullYear() && mm < now.getMonth() + 1) return false
  return true
}

// ── Payment method definitions ────────────────────────────────────────────────

const METHODS = [
  { id: 'card', label: 'Tarjeta' },
  { id: 'apple', label: 'Apple Pay' },
  { id: 'google', label: 'Google Pay' },
]

// ── Brand SVG icons ───────────────────────────────────────────────────────────

function IconCard() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
      <line x1="1" y1="10" x2="23" y2="10"/>
    </svg>
  )
}

function IconApple() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
    </svg>
  )
}

function IconGoogle() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  )
}

const METHOD_ICONS = {
  card: <IconCard />,
  apple: <IconApple />,
  google: <IconGoogle />,
}

// ── External method buttons ───────────────────────────────────────────────────

function ApplePayButton({ onClick, disabled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex w-full items-center justify-center gap-2 rounded-2xl bg-white py-4 text-[#0C0B09] text-base font-bold transition-opacity disabled:opacity-50 hover:opacity-90"
    >
      <IconApple />
      <span>Pay</span>
    </button>
  )
}

function GooglePayButton({ onClick, disabled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex w-full items-center justify-center gap-2 rounded-2xl border border-line bg-surface py-4 text-white text-base font-medium shadow-sm transition-all hover:border-accent/30 disabled:opacity-50"
    >
      <IconGoogle />
      <span>Pay</span>
    </button>
  )
}

// ── Stripe Payment Element inner component ────────────────────────────────────

function StripeForm({ formatted, paying, setPaying, setApiError, onPaid, amountCents }) {
  const stripe = useStripe()
  const elements = useElements()

  async function handleStripeSubmit(e) {
    e.preventDefault()
    if (!stripe || !elements) return
    setPaying(true)
    setApiError(null)
    try {
      const { error } = await stripe.confirmPayment({
        elements,
        redirect: 'if_required',
      })
      if (error) throw new Error(error.message)
      await onPaid(amountCents)
    } catch (err) {
      setApiError(err.message)
      setPaying(false)
    }
  }

  return (
    <form onSubmit={handleStripeSubmit} className="mb-4">
      <PaymentElement options={{ wallets: { applePay: 'auto', googlePay: 'auto' } }} />
      <button
        type="submit"
        disabled={!stripe || paying}
        className="mt-4 w-full rounded-2xl bg-accent px-6 py-3 text-sm font-bold text-[#0C0B09] transition-all hover:bg-accent-light hover:scale-[1.01] active:scale-[0.98] disabled:opacity-50"
      >
        {paying ? 'Procesando pago...' : `Pagar ${formatted}`}
      </button>
    </form>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

// RF-Pagos step 5: cosmetic form — no card data or credentials reach the server.
// When clientSecret is provided (Stripe mode), renders Stripe Payment Element instead.
export function StepCheckout({ booking, appointment, onPaid, onError, clientSecret }) {
  const [method,   setMethod]  = useState('card')
  const [holder,   setHolder]  = useState('')
  const [card,     setCard]    = useState('')
  const [expiry,   setExpiry]  = useState('')
  const [cvv,      setCvv]     = useState('')
  const [touched,  setTouched] = useState({})
  const [paying,   setPaying]  = useState(false)
  const [apiError, setApiError] = useState(null)

  const amountCents = Math.round(booking.service.price * 100)
  const formatted   = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' })
    .format(booking.service.price)

  const cardValid = {
    holder: isHolderValid(holder),
    card:   isCardValid(card),
    expiry: isExpiryValid(expiry),
    cvv:    isCvvValid(cvv),
  }
  const canPay = (method === 'card' ? Object.values(cardValid).every(Boolean) : true) && !paying

  function touch(field) {
    setTouched((t) => ({ ...t, [field]: true }))
  }

  function showError(field) {
    return touched[field] && !cardValid[field]
  }

  function inputClass(field) {
    return [
      'w-full rounded-xl border px-4 py-3 text-base text-white bg-surface-alt placeholder-muted outline-none transition-colors',
      showError(field)
        ? 'border-red-500/50 focus:border-red-500'
        : 'border-line focus:border-accent/50 focus:ring-1 focus:ring-accent/20',
    ].join(' ')
  }

  function handleCard(e)   { setCard(fmtCardNumber(e.target.value)) }
  function handleCvv(e)    { setCvv(e.target.value.replace(/\D/g, '').slice(0, 4)) }
  function handleExpiry(e) {
    const prev = expiry
    const next = fmtExpiry(e.target.value)
    if (prev.endsWith('/') && e.target.value.length < prev.length) {
      setExpiry(e.target.value.replace(/\D/g, '').slice(0, 2))
    } else {
      setExpiry(next)
    }
  }

  async function handlePay() {
    if (method === 'card') {
      setTouched({ holder: true, card: true, expiry: true, cvv: true })
    }
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

  function handleExternalPay() {
    if (!paying) handlePay()
  }

  function handleMethodChange(id) {
    setMethod(id)
    setApiError(null)
    setTouched({})
  }

  const labelClass = 'flex flex-col gap-1.5 text-xs font-bold uppercase tracking-wider text-muted'

  return (
    <section>
      <h2>Pago de tu cita</h2>

      {/* Order summary */}
      <div className="mb-5 rounded-2xl border border-line bg-surface p-4">
        <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-2 text-sm">
          <dt className="text-muted">Servicio</dt>
          <dd className="m-0 text-right font-medium text-white">{booking.service.name}</dd>
          <dt className="text-muted">Cita #</dt>
          <dd className="m-0 text-right font-mono text-xs text-muted">{appointment.id}</dd>
        </dl>
        <div className="mt-3 flex items-center justify-between border-t border-line pt-3">
          <span className="text-[10px] font-bold uppercase tracking-widest text-muted">Total</span>
          <span className="text-2xl font-black" style={{ color: booking.service.color || '#C8973E', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            {formatted}
          </span>
        </div>
      </div>

      {/* Stripe mode */}
      {_stripePromise && clientSecret ? (
        <Elements stripe={_stripePromise} options={{ clientSecret, appearance: { theme: 'night', variables: { colorPrimary: '#C8973E' } } }}>
          <StripeForm
            formatted={formatted}
            paying={paying}
            setPaying={setPaying}
            setApiError={setApiError}
            onPaid={onPaid}
            amountCents={amountCents}
          />
        </Elements>
      ) : (
        <>
          {/* Method selector */}
          <div className="mb-4">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-muted">Método de pago</p>
            <div className="grid grid-cols-3 gap-1.5">
              {METHODS.map(({ id, label }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => handleMethodChange(id)}
                  disabled={paying}
                  className={[
                    'flex flex-col items-center gap-1 rounded-xl border py-2.5 px-1 text-[10px] font-bold transition-all uppercase tracking-wider',
                    method === id
                      ? 'border-accent/50 bg-accent/10 text-accent'
                      : 'border-line bg-surface text-muted hover:border-accent/30 hover:text-muted',
                  ].join(' ')}
                  title={label}
                >
                  {METHOD_ICONS[id]}
                  <span className="leading-tight text-center">{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Method content */}
          {method === 'card' && (
            <fieldset className="mb-4 rounded-2xl border border-line p-4" disabled={paying}>
              <legend className="px-1 text-[10px] font-bold uppercase tracking-widest text-muted">
                Datos de tarjeta (simulado)
              </legend>

              <div className="mb-3">
                <label className={labelClass}>
                  Nombre en la tarjeta
                  <input
                    type="text"
                    autoComplete="cc-name"
                    placeholder="Titular de la tarjeta"
                    className={inputClass('holder')}
                    value={holder}
                    onChange={(e) => setHolder(e.target.value.replace(/[^A-Za-zÀ-ÿ\s]/g, ''))}
                    onBlur={() => touch('holder')}
                  />
                </label>
                {showError('holder') && (
                  <p className="mt-1 text-xs text-red-400">Ingresa el nombre tal como aparece en la tarjeta.</p>
                )}
              </div>

              <div className="mb-3">
                <label className={labelClass}>
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
                  <p className="mt-1 text-xs text-red-400">Ingresa los 16 dígitos de tu tarjeta.</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>
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
                    <p className="mt-1 text-xs text-red-400">Fecha inválida o vencida.</p>
                  )}
                </div>
                <div>
                  <label className={labelClass}>
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
                    <p className="mt-1 text-xs text-red-400">CVV inválido.</p>
                  )}
                </div>
              </div>

              <p className="mt-3 text-xs text-muted">
                Simulado — ningún dato de tarjeta es procesado ni almacenado.
              </p>
            </fieldset>
          )}

          {method !== 'card' && (
            <div className="mb-4 rounded-2xl border border-line p-4">
              {method === 'apple'  && <ApplePayButton  onClick={handleExternalPay} disabled={paying} />}
              {method === 'google' && <GooglePayButton onClick={handleExternalPay} disabled={paying} />}
              <p className="mt-3 text-center text-xs text-muted">
                Simulado — entorno de prueba, no se realiza ningún cargo real.
              </p>
            </div>
          )}

          {apiError && (
            <p className="mb-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">{apiError}</p>
          )}

          {method === 'card' && (
            <button
              type="button"
              className="w-full rounded-2xl bg-accent px-6 py-3.5 text-sm font-bold text-[#0C0B09] transition-all hover:bg-accent-light hover:scale-[1.02] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100 shadow-[0_8px_24px_rgba(200,151,62,0.25)]"
              onClick={handlePay}
              disabled={!canPay}
            >
              {paying ? 'Procesando pago...' : `Pagar ${formatted}`}
            </button>
          )}
        </>
      )}

      <button
        type="button"
        onClick={() => onError('canceled')}
        className="mt-3 w-full border-0 bg-transparent text-sm text-muted hover:text-muted underline transition-colors"
        disabled={paying}
      >
        Cancelar
      </button>
    </section>
  )
}

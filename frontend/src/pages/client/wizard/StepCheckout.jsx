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
  { id: 'paypal', label: 'PayPal' },
  { id: 'mercadopago', label: 'Mercado Pago' },
]

// ── Brand SVG icons (inline, no external deps) ────────────────────────────────

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

function IconPayPal() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.067 8.478c.492.315.844.825.983 1.39.466 1.868-.73 3.746-2.498 4.087-.318.062-.64.09-.963.088H15.62l-.42 2.65a.32.32 0 01-.316.27H13.08a.213.213 0 01-.21-.245l1.482-9.39a.32.32 0 01.316-.27h3.483c.665 0 1.286.17 1.916.42zm-1.24 1.568c-.1-.4-.45-.63-.86-.63h-2.2l-.7 4.42h1.9c1.11 0 2.06-.76 2.23-1.86.13-.84-.1-1.58-.37-1.93zM5.355 7.307H8.84c1.356 0 2.58.73 3.024 2.016.49 1.412-.063 3.006-1.305 3.77-.508.314-1.09.47-1.68.47H7.21l-.42 2.656a.32.32 0 01-.316.27H4.67a.213.213 0 01-.21-.245L5.04 7.577a.32.32 0 01.315-.27zm1.42 1.57l-.7 4.42h1.46c1.11 0 2.06-.76 2.23-1.86.19-1.22-.58-2.2-1.77-2.56H6.775z" fill="#003087"/>
      <path d="M11.47 7.307h3.485c.665 0 1.287.17 1.916.42.492.315.844.825.983 1.39.466 1.868-.73 3.746-2.498 4.087-.318.062-.64.09-.963.088H12.43l-.42 2.65a.32.32 0 01-.316.27h-1.805a.213.213 0 01-.21-.245l1.482-9.39a.32.32 0 01.31-.27z" fill="#009cde"/>
    </svg>
  )
}

function IconMP() {
  return (
    <svg width="18" height="18" viewBox="0 0 40 24" fill="none">
      <rect width="40" height="24" rx="4" fill="#009ee3"/>
      <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold" fontFamily="sans-serif">MP</text>
    </svg>
  )
}

const METHOD_ICONS = {
  card: <IconCard />,
  apple: <IconApple />,
  google: <IconGoogle />,
  paypal: <IconPayPal />,
  mercadopago: <IconMP />,
}

// ── External method buttons (branded, cosmetic in Phase 1) ────────────────────

function ApplePayButton({ onClick, disabled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex w-full items-center justify-center gap-2 rounded-xl bg-black py-4 text-white text-base font-semibold transition-opacity disabled:opacity-50"
      style={{ letterSpacing: '0.02em' }}
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
      className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#dadce0] bg-white py-4 text-[#3c4043] text-base font-medium shadow-sm transition-shadow hover:shadow disabled:opacity-50"
    >
      <IconGoogle />
      <span style={{ fontFamily: 'Google Sans, sans-serif' }}>Pay</span>
    </button>
  )
}

function PayPalButton({ onClick, disabled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex w-full items-center justify-center gap-2 rounded-xl py-4 text-white text-base font-bold transition-opacity disabled:opacity-50"
      style={{ background: '#0070ba' }}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
        <path d="M20.067 8.478c.492.315.844.825.983 1.39.466 1.868-.73 3.746-2.498 4.087-.318.062-.64.09-.963.088H15.62l-.42 2.65a.32.32 0 01-.316.27H13.08a.213.213 0 01-.21-.245l1.482-9.39a.32.32 0 01.316-.27h3.483c.665 0 1.286.17 1.916.42zm-1.24 1.568c-.1-.4-.45-.63-.86-.63h-2.2l-.7 4.42h1.9c1.11 0 2.06-.76 2.23-1.86.13-.84-.1-1.58-.37-1.93zM5.355 7.307H8.84c1.356 0 2.58.73 3.024 2.016.49 1.412-.063 3.006-1.305 3.77-.508.314-1.09.47-1.68.47H7.21l-.42 2.656a.32.32 0 01-.316.27H4.67a.213.213 0 01-.21-.245L5.04 7.577a.32.32 0 01.315-.27zm1.42 1.57l-.7 4.42h1.46c1.11 0 2.06-.76 2.23-1.86.19-1.22-.58-2.2-1.77-2.56H6.775z"/>
      </svg>
      <span>PayPal</span>
    </button>
  )
}

function MercadoPagoButton({ onClick, disabled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex w-full items-center justify-center gap-2 rounded-xl py-4 text-white text-base font-bold transition-opacity disabled:opacity-50"
      style={{ background: '#009ee3' }}
    >
      <svg width="22" height="22" viewBox="0 0 24 24" fill="white">
        <circle cx="12" cy="12" r="10"/>
        <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle" fill="#009ee3" fontSize="8" fontWeight="bold" fontFamily="sans-serif">MP</text>
      </svg>
      <span>Mercado Pago</span>
    </button>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

// RF-Pagos step 5: cosmetic form — no card data or credentials reach the server.
export function StepCheckout({ booking, appointment, onPaid, onError }) {
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
  // Card requires all 4 fields; external methods are always ready.
  const canPay = (method === 'card' ? Object.values(cardValid).every(Boolean) : true) && !paying

  function touch(field) {
    setTouched((t) => ({ ...t, [field]: true }))
  }

  function showError(field) {
    return touched[field] && !cardValid[field]
  }

  function inputClass(field) {
    return [
      'rounded-lg border p-[0.6rem] text-base w-full transition-colors',
      showError(field)
        ? 'border-[#c0392b] focus-visible:border-[#c0392b]'
        : 'border-line focus-visible:border-secondary',
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

  // External methods trigger payment directly from their branded button.
  function handleExternalPay() {
    if (!paying) handlePay()
  }

  function handleMethodChange(id) {
    setMethod(id)
    setApiError(null)
    setTouched({})
  }

  return (
    <section>
      <h2>Pago de tu cita</h2>

      {/* Order summary */}
      <div className="border-line mb-5 rounded-xl border bg-white p-4">
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

      {/* Method selector */}
      <div className="mb-4">
        <p className="text-muted mb-2 text-xs font-semibold uppercase tracking-wide">Método de pago</p>
        <div className="grid grid-cols-5 gap-1.5">
          {METHODS.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => handleMethodChange(id)}
              disabled={paying}
              className={[
                'flex flex-col items-center gap-1 rounded-xl border py-2.5 px-1 text-[10px] font-semibold transition-all',
                method === id
                  ? 'border-secondary bg-secondary/10 text-secondary'
                  : 'border-line text-muted hover:border-secondary/40',
              ].join(' ')}
              title={label}
            >
              {METHOD_ICONS[id]}
              <span className="leading-tight text-center">{id === 'mercadopago' ? 'M. Pago' : label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Method content */}
      {method === 'card' && (
        <fieldset className="mb-4 rounded-xl border border-[#e2e8f0] p-4" disabled={paying}>
          <legend className="text-muted px-1 text-xs font-semibold uppercase tracking-wide">
            Datos de tarjeta (simulado)
          </legend>

          <div className="mb-3">
            <label className="flex flex-col gap-1.5 text-sm font-medium">
              Nombre en la tarjeta
              <input
                type="text"
                autoComplete="cc-name"
                placeholder="Escribe el nombre del titular..."
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
            Simulado — ningún dato de tarjeta es procesado ni almacenado.
          </p>
        </fieldset>
      )}

      {method !== 'card' && (
        <div className="mb-4 rounded-xl border border-[#e2e8f0] p-4">
          {method === 'apple'       && <ApplePayButton      onClick={handleExternalPay} disabled={paying} />}
          {method === 'google'      && <GooglePayButton     onClick={handleExternalPay} disabled={paying} />}
          {method === 'paypal'      && <PayPalButton        onClick={handleExternalPay} disabled={paying} />}
          {method === 'mercadopago' && <MercadoPagoButton   onClick={handleExternalPay} disabled={paying} />}
          <p className="text-muted mt-3 text-center text-xs">
            Simulado — entorno de prueba, no se realiza ningún cargo real.
          </p>
        </div>
      )}

      {apiError && <p className="mb-4 text-sm text-[#c0392b]">{apiError}</p>}

      {/* Unified pay button only for card; external methods use their own branded button */}
      {method === 'card' && (
        <button
          type="button"
          className="bg-secondary w-full rounded-full px-6 py-3 text-sm font-semibold text-white transition-transform duration-150 hover:scale-[1.02] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
          onClick={handlePay}
          disabled={!canPay}
        >
          {paying ? 'Procesando pago...' : `Pagar ${formatted}`}
        </button>
      )}

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

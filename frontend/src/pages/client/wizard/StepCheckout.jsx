import { useState } from 'react'

// RF-Pagos step 5: payment form (mock provider — no real card data is sent to the server).
// The card fields are purely cosmetic in Phase 1; we never send card numbers to the backend.
export function StepCheckout({ booking, appointment, onPaid, onError }) {
  const [cardHolder, setCardHolder] = useState('')
  const [paying, setPaying] = useState(false)
  const [localError, setLocalError] = useState(null)

  const amountCents = Math.round(booking.service.price * 100)
  const formatted = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(
    booking.service.price
  )
  const canPay = cardHolder.trim().length > 0 && !paying

  const inputClass =
    'border-line focus-visible:border-secondary rounded-lg border p-[0.6rem] text-base w-full'

  async function handlePay() {
    setPaying(true)
    setLocalError(null)
    try {
      await onPaid(amountCents)
    } catch (err) {
      setLocalError(err.message)
      setPaying(false)
    }
  }

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

      {/* Card form — cosmetic only in Phase 1 */}
      <fieldset className="mb-4 rounded-xl border border-[#e2e8f0] p-4" disabled={paying}>
        <legend className="text-muted px-1 text-xs font-semibold uppercase tracking-wide">
          Datos de tarjeta (simulado)
        </legend>

        <label className="mb-3 flex flex-col gap-1.5 text-sm font-medium">
          Nombre en la tarjeta
          <input
            type="text"
            autoComplete="cc-name"
            placeholder="Ej. Juan Pérez"
            className={inputClass}
            value={cardHolder}
            onChange={(e) => setCardHolder(e.target.value)}
          />
        </label>

        <div className="mb-3 grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1.5 text-sm font-medium">
            Número de tarjeta
            <input
              type="text"
              inputMode="numeric"
              placeholder="•••• •••• •••• ••••"
              maxLength={19}
              className={inputClass}
              readOnly
              tabIndex={-1}
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-medium">
            Vencimiento
            <input
              type="text"
              placeholder="MM/AA"
              maxLength={5}
              className={inputClass}
              readOnly
              tabIndex={-1}
            />
          </label>
        </div>

        <p className="text-muted mt-1 text-xs">
          Entorno de prueba — ningún dato de tarjeta es procesado ni almacenado.
        </p>
      </fieldset>

      {localError && <p className="mb-4 text-[#c0392b]">{localError}</p>}

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
        className="text-muted mt-3 w-full bg-transparent border-0 text-sm underline"
        disabled={paying}
      >
        Cancelar
      </button>
    </section>
  )
}

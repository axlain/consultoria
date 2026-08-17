const NAME_RE = /^[A-Za-zÀ-ÿ\s]+$/

// RF03 step 4: confirmation.
export function StepConfirm({ booking, onChange, onBack, onConfirm, submitting, error }) {
  const canSubmit =
    NAME_RE.test(booking.customerName.trim()) &&
    NAME_RE.test(booking.customerLastName.trim()) &&
    booking.customerPhone.length === 10

  function handleNameChange(e) {
    onChange({ customerName: e.target.value.replace(/[^A-Za-zÀ-ÿ\s]/g, '') })
  }

  function handleLastNameChange(e) {
    onChange({ customerLastName: e.target.value.replace(/[^A-Za-zÀ-ÿ\s]/g, '') })
  }

  function handlePhoneChange(e) {
    onChange({ customerPhone: e.target.value.replace(/\D/g, '').slice(0, 10) })
  }

  const inputClass = 'border-line focus-visible:border-secondary rounded-lg border p-[0.6rem] text-base'

  return (
    <section>
      <h2>Confirma tu cita</h2>

      <div className="border-line mb-6 rounded-xl border bg-white p-4">
        <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-2 text-sm">
          <dt className="text-muted">Servicio</dt>
          <dd className="m-0 text-right font-medium">{booking.service.name}</dd>
          <dt className="text-muted">Profesional</dt>
          <dd className="m-0 text-right font-medium">{booking.professional.name}</dd>
          <dt className="text-muted">Fecha</dt>
          <dd className="m-0 text-right font-medium">{booking.date}</dd>
          <dt className="text-muted">Hora</dt>
          <dd className="m-0 text-right font-medium">{booking.time}</dd>
        </dl>
        <div className="border-line mt-3 flex items-center justify-between border-t pt-3">
          <span className="text-muted text-xs font-semibold tracking-wide uppercase">Total</span>
          <span className="text-lg font-bold" style={{ color: booking.service.color }}>
            ${booking.service.price}
          </span>
        </div>
      </div>

      <label className="mb-4 flex flex-col gap-1.5 text-sm font-medium">
        Nombre
        <input type="text" className={inputClass} value={booking.customerName} onChange={handleNameChange} />
      </label>

      <label className="mb-4 flex flex-col gap-1.5 text-sm font-medium">
        Apellido Paterno
        <input type="text" className={inputClass} value={booking.customerLastName} onChange={handleLastNameChange} />
      </label>

      <label className="mb-4 flex flex-col gap-1.5 text-sm font-medium">
        Teléfono
        <input
          type="tel"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={10}
          placeholder="10 dígitos"
          className={inputClass}
          value={booking.customerPhone}
          onChange={handlePhoneChange}
        />
      </label>

      {error && <p className="text-[#c0392b]">{error}</p>}

      <div className="mt-6 flex items-center justify-between">
        <button
          type="button"
          className="text-secondary border-0 bg-transparent p-0 text-sm font-semibold disabled:opacity-50"
          onClick={onBack}
          disabled={submitting}
        >
          ← Atrás
        </button>
        <button
          type="button"
          className="bg-secondary rounded-full px-6 py-2.5 text-sm font-semibold text-white transition-transform duration-150 hover:scale-[1.02] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
          onClick={onConfirm}
          disabled={!canSubmit || submitting}
        >
          {submitting ? 'Confirmando...' : 'Confirmar cita'}
        </button>
      </div>
    </section>
  )
}

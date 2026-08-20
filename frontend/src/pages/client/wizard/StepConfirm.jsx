const NAME_RE = /^[A-Za-zÀ-ÿ\s]+$/

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

  const inputClass = 'w-full rounded-xl border border-line bg-surface px-4 py-3.5 text-base text-ink placeholder-muted outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent/30'
  const labelClass = 'flex flex-col gap-1.5 text-xs font-bold uppercase tracking-wider text-muted'

  return (
    <section>
      <h2 className="text-xl font-bold text-ink mb-5">Confirma tu cita</h2>

      {/* Summary card */}
      <div className="mb-6 rounded-2xl border border-line bg-surface p-4">
        <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-2 text-sm">
          <dt className="text-muted">Servicio</dt>
          <dd className="m-0 text-right font-medium text-ink">{booking.service.name}</dd>
          <dt className="text-muted">Profesional</dt>
          <dd className="m-0 text-right font-medium text-ink">{booking.professional.name}</dd>
          <dt className="text-muted">Fecha</dt>
          <dd className="m-0 text-right font-medium text-ink">{booking.date}</dd>
          <dt className="text-muted">Hora</dt>
          <dd className="m-0 text-right font-medium text-ink">{booking.time}</dd>
        </dl>
        <div className="mt-3 flex items-center justify-between border-t border-line pt-3">
          <span className="text-[10px] font-bold uppercase tracking-widest text-muted">Total</span>
          <span className="text-xl font-extrabold text-accent">${booking.service.price}</span>
        </div>
      </div>

      <label className={`mb-4 ${labelClass}`}>
        Nombre
        <input type="text" className={inputClass} value={booking.customerName} onChange={handleNameChange} placeholder="Tu nombre" />
      </label>

      <label className={`mb-4 ${labelClass}`}>
        Apellido Paterno
        <input type="text" className={inputClass} value={booking.customerLastName} onChange={handleLastNameChange} placeholder="Tu apellido" />
      </label>

      <label className={`mb-4 ${labelClass}`}>
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

      {error && (
        <p className="mb-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</p>
      )}

      <div className="mt-6 flex items-center justify-between">
        <button
          type="button"
          className="border-0 bg-transparent p-0 text-sm font-semibold text-accent hover:opacity-70 transition-opacity disabled:opacity-30"
          onClick={onBack}
          disabled={submitting}
        >
          ← Atrás
        </button>
        <button
          type="button"
          className="rounded-2xl bg-accent px-6 py-2.5 text-sm font-bold text-[#0C0B09] transition-all duration-150 hover:bg-accent-light active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
          onClick={onConfirm}
          disabled={!canSubmit || submitting}
        >
          {submitting ? 'Confirmando...' : 'Confirmar cita'}
        </button>
      </div>
    </section>
  )
}

// RF03 step 4 / RF04: confirmation, with tattoo-only fields shown conditionally.
export function StepConfirm({ booking, onChange, onBack, onConfirm, submitting, error }) {
  const requiresTattooDetails = booking.service.requires_tattoo_details

  function updateTattooDetails(patch) {
    onChange({ tattooDetails: { ...(booking.tattooDetails ?? {}), ...patch } })
  }

  const canSubmit =
    booking.customerName.trim() &&
    booking.customerPhone.trim() &&
    (!requiresTattooDetails ||
      (booking.tattooDetails?.width_cm && booking.tattooDetails?.height_cm && booking.tattooDetails?.body_zone))

  return (
    <section>
      <h2>Confirma tu cita</h2>
      <ul className="summary-list">
        <li>Servicio: {booking.service.name}</li>
        <li>Profesional: {booking.professional.name}</li>
        <li>Fecha: {booking.date}</li>
        <li>Hora: {booking.time}</li>
      </ul>

      <label>
        Nombre
        <input
          type="text"
          value={booking.customerName}
          onChange={(e) => onChange({ customerName: e.target.value })}
        />
      </label>

      <label>
        Teléfono
        <input
          type="tel"
          value={booking.customerPhone}
          onChange={(e) => onChange({ customerPhone: e.target.value })}
        />
      </label>

      {requiresTattooDetails && (
        <fieldset className="tattoo-fields">
          <legend>Detalles del tatuaje</legend>
          <label>
            Ancho (cm)
            <input
              type="number"
              min="1"
              value={booking.tattooDetails?.width_cm ?? ''}
              onChange={(e) => updateTattooDetails({ width_cm: Number(e.target.value) })}
            />
          </label>
          <label>
            Alto (cm)
            <input
              type="number"
              min="1"
              value={booking.tattooDetails?.height_cm ?? ''}
              onChange={(e) => updateTattooDetails({ height_cm: Number(e.target.value) })}
            />
          </label>
          <label>
            Zona del cuerpo
            <input
              type="text"
              value={booking.tattooDetails?.body_zone ?? ''}
              onChange={(e) => updateTattooDetails({ body_zone: e.target.value })}
            />
          </label>
          <label>
            Imagen de referencia (URL)
            <input
              type="url"
              value={booking.tattooDetails?.reference_image_url ?? ''}
              onChange={(e) => updateTattooDetails({ reference_image_url: e.target.value })}
            />
          </label>
        </fieldset>
      )}

      {error && <p className="form-error">{error}</p>}

      <div className="wizard-actions">
        <button type="button" className="link-button" onClick={onBack} disabled={submitting}>
          Atrás
        </button>
        <button type="button" onClick={onConfirm} disabled={!canSubmit || submitting}>
          {submitting ? 'Confirmando...' : 'Confirmar cita'}
        </button>
      </div>
    </section>
  )
}

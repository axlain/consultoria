import { useEffect, useState } from 'react'
import { api } from '../../../api/client'

function todayIso() {
  return new Date().toISOString().slice(0, 10)
}

// RF03 step 3 / RF05: fetches live availability so booked slots disappear immediately.
export function StepDateTime({ tenantSlug, professional, date, onChange, onNext, onBack }) {
  const [selectedDate, setSelectedDate] = useState(date || todayIso())
  const [slots, setSlots] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    api
      .getAvailability(tenantSlug, professional.id, selectedDate)
      .then((data) => {
        if (!cancelled) setSlots(data)
      })
      .catch((err) => {
        if (!cancelled) setError(err.message)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [tenantSlug, professional.id, selectedDate])

  function handleDateChange(event) {
    setSelectedDate(event.target.value)
    onChange({ date: event.target.value, time: '' })
  }

  function handleSelectSlot(slot) {
    onChange({ date: selectedDate, time: slot })
    onNext()
  }

  return (
    <section>
      <h2>Elige fecha y hora</h2>
      <label>
        Fecha
        <input type="date" value={selectedDate} min={todayIso()} onChange={handleDateChange} />
      </label>

      {loading && <p>Cargando disponibilidad...</p>}
      {error && <p className="form-error">{error}</p>}

      {!loading && !error && (
        <ul className="option-list slots">
          {slots.length === 0 && <li>No hay horarios disponibles este día.</li>}
          {slots.map((slot) => (
            <li key={slot}>
              <button type="button" onClick={() => handleSelectSlot(slot)}>
                {slot}
              </button>
            </li>
          ))}
        </ul>
      )}

      <button type="button" className="link-button" onClick={onBack}>
        Atrás
      </button>
    </section>
  )
}

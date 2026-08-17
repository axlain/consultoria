import { useEffect, useState } from 'react'
import { api } from '../../../api/client'
import { DateStrip, buildDateRange, toIso } from '../../../components/DateStrip'

const DAYS_AHEAD = 14
const DATE_STRIP = buildDateRange(DAYS_AHEAD)

// RF03 step 2 / RF05: horizontal date strip + time chips, with live availability per day.
// Slots are aggregated across every professional offering the service; a slot never
// disappears just because it's taken — it's shown disabled instead (still surfaces
// which times exist at all, so the client isn't guessing).
export function StepDateTime({ tenantSlug, serviceId, date, onChange, onNext, onBack }) {
  const [selectedDate, setSelectedDate] = useState(date || toIso(DATE_STRIP[0]))
  const [open, setOpen] = useState(true)
  const [slots, setSlots] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)
  const [retryCount, setRetryCount] = useState(0)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(false)

    api
      .getAvailability(tenantSlug, { date: selectedDate, serviceId })
      .then((data) => {
        if (!cancelled) {
          setOpen(data.open)
          setSlots(data.slots)
        }
      })
      .catch(() => {
        if (!cancelled) setError(true)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [tenantSlug, serviceId, selectedDate, retryCount])

  function handleDateSelect(iso) {
    setSelectedDate(iso)
    onChange({ date: iso, time: '' })
  }

  function handleSelectSlot(slot) {
    onChange({ date: selectedDate, time: slot })
    onNext()
  }

  return (
    <section>
      <h2>Elige fecha y hora</h2>

      <div className="mb-5">
        <DateStrip dates={DATE_STRIP} selectedDate={selectedDate} onSelect={handleDateSelect} />
      </div>

      {loading && (
        <div className="flex flex-wrap gap-2" aria-live="polite" aria-busy="true">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-line h-[42px] w-20 animate-pulse rounded-full" />
          ))}
        </div>
      )}

      {!loading && error && (
        <div className="border-line rounded-xl border bg-white px-4 py-5 text-center">
          <p className="text-muted text-sm">Hubo un problema al cargar los horarios. Intenta de nuevo.</p>
          <button
            type="button"
            className="text-secondary mt-2 text-sm font-semibold"
            onClick={() => setRetryCount((c) => c + 1)}
          >
            Reintentar
          </button>
        </div>
      )}

      {!loading && !error && !open && (
        <p className="text-muted text-sm">Nadie labora este día. Elige otra fecha.</p>
      )}

      {!loading && !error && open && slots.length === 0 && (
        <p className="text-muted text-sm">No hay horarios disponibles para esta fecha.</p>
      )}

      {!loading && !error && open && slots.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {slots.map(({ time, available }) => (
            <button
              key={time}
              type="button"
              disabled={!available}
              className={
                available
                  ? 'border-line hover:border-secondary rounded-full border bg-white px-4 py-2.5 text-sm font-medium tabular-nums transition-all duration-150 hover:-translate-y-0.5 hover:shadow-[0_4px_10px_rgba(0,0,0,0.06)]'
                  : 'border-line text-muted cursor-not-allowed rounded-full border bg-white px-4 py-2.5 text-sm font-medium tabular-nums line-through opacity-50'
              }
              onClick={() => available && handleSelectSlot(time)}
            >
              {time}
            </button>
          ))}
        </div>
      )}

      <button type="button" className="text-secondary mt-6 border-0 bg-transparent p-0 text-sm font-semibold" onClick={onBack}>
        ← Atrás
      </button>
    </section>
  )
}

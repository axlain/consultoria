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

    return () => { cancelled = true }
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
      <h2 className="text-xl font-bold text-[#F2EBE0] mb-5">Elige fecha y hora</h2>

      <div className="mb-5">
        <DateStrip dates={DATE_STRIP} selectedDate={selectedDate} onSelect={handleDateSelect} />
      </div>

      {loading && (
        <div className="grid grid-cols-4 gap-2" aria-live="polite" aria-busy="true">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-10 animate-pulse rounded-xl bg-[#1E1B15]" />
          ))}
        </div>
      )}

      {!loading && error && (
        <div className="rounded-2xl border border-[#2A2520] bg-[#1E1B15] px-4 py-5 text-center">
          <p className="text-sm text-[#7A7065]">Hubo un problema al cargar los horarios.</p>
          <button type="button" className="mt-2 text-sm font-semibold text-[#C8973E] hover:opacity-70 transition-opacity"
            onClick={() => setRetryCount((c) => c + 1)}>
            Reintentar
          </button>
        </div>
      )}

      {!loading && !error && !open && (
        <p className="text-sm text-[#7A7065] text-center py-4">Nadie labora este día. Elige otra fecha.</p>
      )}

      {!loading && !error && open && slots.length === 0 && (
        <p className="text-sm text-[#7A7065] text-center py-4">No hay horarios disponibles para esta fecha.</p>
      )}

      {!loading && !error && open && slots.length > 0 && (
        <>
          <p className="text-xs font-bold text-[#7A7065] uppercase tracking-wider mb-3">Horarios disponibles</p>
          <div className="grid grid-cols-4 gap-2">
            {slots.map(({ time, available }) => (
              <button
                key={time}
                type="button"
                disabled={!available}
                className={
                  available
                    ? 'slot-available rounded-xl border border-[#2A2520] bg-[#1E1B15] py-2.5 text-sm font-medium tabular-nums text-[#F2EBE0] transition-all duration-150 hover:border-[#C8973E] hover:bg-[#C8973E]/10 hover:text-[#C8973E] active:scale-[0.97]'
                    : 'cursor-not-allowed rounded-xl border border-[#2A2520] bg-[#161410] py-2.5 text-sm font-medium tabular-nums text-[#2A2520] line-through opacity-40'
                }
                onClick={() => available && handleSelectSlot(time)}
              >
                {time}
              </button>
            ))}
          </div>
        </>
      )}

      <button type="button" className="mt-6 border-0 bg-transparent p-0 text-sm font-semibold text-[#C8973E] hover:opacity-70 transition-opacity" onClick={onBack}>
        ← Atrás
      </button>
    </section>
  )
}

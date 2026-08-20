import { useEffect, useState } from 'react'
import { api } from '../../../api/client'
import { buildDateRange, toIso } from '../../../components/DateStrip'

const DAYS_AHEAD = 30
const DATE_STRIP = buildDateRange(DAYS_AHEAD)
const MONTHS_ES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
const WEEKDAYS_ES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
const WEEKDAYS_SHORT = ['D', 'L', 'M', 'X', 'J', 'V', 'S']

function buildCalendarGrid(year, month) {
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells = []
  for (let i = 0; i < firstDay; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)
  return cells
}

export function StepDateTime({ tenantSlug, serviceId, date, onChange, onNext, onBack }) {
  const today = DATE_STRIP[0]
  const [viewYear, setViewYear] = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth())
  const [selectedDate, setSelectedDate] = useState(date || toIso(today))
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

  function prevMonth() {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11) }
    else setViewMonth(m => m - 1)
  }

  function nextMonth() {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0) }
    else setViewMonth(m => m + 1)
  }

  const todayIso = toIso(today)
  const calCells = buildCalendarGrid(viewYear, viewMonth)

  return (
    <section>
      <h2 className="text-xl font-bold text-[#F2EBE0] mb-5">Elige fecha y hora</h2>

      {/* Calendar */}
      <div className="bg-[#1E1B15] border border-[#2A2520] rounded-2xl p-4 mb-5">
        {/* Month nav */}
        <div className="flex items-center justify-between mb-4">
          <button type="button" onClick={prevMonth}
            className="w-8 h-8 rounded-xl border border-[#2A2520] flex items-center justify-center text-[#7A7065] hover:border-[#C8973E]/40 hover:text-[#C8973E] transition-colors">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <span className="text-sm font-semibold text-[#F2EBE0] capitalize">
            {MONTHS_ES[viewMonth]} {viewYear}
          </span>
          <button type="button" onClick={nextMonth}
            className="w-8 h-8 rounded-xl border border-[#2A2520] flex items-center justify-center text-[#7A7065] hover:border-[#C8973E]/40 hover:text-[#C8973E] transition-colors">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
        </div>

        {/* Weekday headers */}
        <div className="grid grid-cols-7 mb-1">
          {WEEKDAYS_SHORT.map((d) => (
            <div key={d} className="h-8 flex items-center justify-center text-[10px] font-bold text-[#7A7065] uppercase">
              {d}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7 gap-y-0.5">
          {calCells.map((day, idx) => {
            if (!day) return <div key={`empty-${idx}`} />
            const iso = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
            const isPast = iso < todayIso
            const isSelected = iso === selectedDate
            const isToday = iso === todayIso
            return (
              <button
                key={iso}
                type="button"
                disabled={isPast}
                onClick={() => !isPast && handleDateSelect(iso)}
                className={[
                  'h-9 w-full rounded-xl text-sm font-medium transition-all duration-100',
                  isPast ? 'text-[#2A2520] cursor-not-allowed' :
                  isSelected ? 'bg-[#C8973E] text-[#0C0B09] font-bold' :
                  isToday ? 'border border-[#C8973E]/40 text-[#C8973E]' :
                  'text-[#F2EBE0]/80 hover:bg-[#C8973E]/15 hover:text-[#C8973E]',
                ].join(' ')}
              >
                {day}
              </button>
            )
          })}
        </div>

        {/* Selected date label */}
        {selectedDate && (
          <p className="text-center text-xs text-[#7A7065] mt-3 pt-3 border-t border-[#2A2520]">
            {(() => {
              const d = new Date(selectedDate + 'T12:00:00')
              return `${WEEKDAYS_ES[d.getDay()]}, ${d.getDate()} de ${MONTHS_ES[d.getMonth()]} ${d.getFullYear()}`
            })()}
          </p>
        )}
      </div>

      {/* Time slots */}
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

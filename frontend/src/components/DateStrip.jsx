const MONTHS_ES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
const WEEKDAYS_ES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

export function toIso(d) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

// Days starting at `startDate` (local time), forward-looking — defaults to today.
// Used by both the booking wizard and the admin agenda so "today" always means
// the viewer's today, and the admin list can also be re-centered on whichever
// date is picked in the strip.
export function buildDateRange(days, startDate = new Date()) {
  const start = new Date(startDate)
  start.setHours(0, 0, 0, 0)
  return Array.from({ length: days }, (_, i) => {
    const d = new Date(start)
    d.setDate(d.getDate() + i)
    return d
  })
}

// Horizontal swipeable day picker shared by the client booking wizard (step 3) and
// the admin agenda, so both surfaces navigate dates the same way.
export function DateStrip({ dates, selectedDate, onSelect }) {
  return (
    <div
      className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      role="listbox"
      aria-label="Selecciona una fecha"
    >
      {dates.map((d) => {
        const iso = toIso(d)
        const active = iso === selectedDate
        return (
          <button
            key={iso}
            type="button"
            role="option"
            aria-selected={active}
            onClick={() => onSelect(iso)}
            className={`flex shrink-0 flex-col items-center gap-0.5 rounded-xl border px-3.5 py-2.5 text-sm transition-colors ${
              active ? 'border-secondary bg-secondary text-white' : 'border-line bg-white hover:border-secondary/50'
            }`}
          >
            <span className="font-semibold whitespace-nowrap">
              {MONTHS_ES[d.getMonth()]} {d.getDate()}
            </span>
            <span className={active ? 'text-white/80' : 'text-muted'}>{WEEKDAYS_ES[d.getDay()]}</span>
          </button>
        )
      })}
    </div>
  )
}

const MONTHS_ES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
const WEEKDAYS_ES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

export function toIso(d) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function buildDateRange(days, startDate = new Date()) {
  const start = new Date(startDate)
  start.setHours(0, 0, 0, 0)
  return Array.from({ length: days }, (_, i) => {
    const d = new Date(start)
    d.setDate(d.getDate() + i)
    return d
  })
}

export function DateStrip({ dates, selectedDate, onSelect }) {
  return (
    <div
      className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
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
            className={`flex shrink-0 flex-col items-center gap-0.5 rounded-xl border px-3.5 py-2.5 text-sm transition-all ${
              active
                ? 'border-accent bg-accent text-[#0C0B09] font-bold'
                : 'border-line bg-surface text-muted hover:border-accent/40 hover:text-ink'
            }`}
          >
            <span className="font-semibold whitespace-nowrap">
              {MONTHS_ES[d.getMonth()]} {d.getDate()}
            </span>
            <span className={active ? 'text-[#0C0B09]/70 text-xs' : 'text-muted/70 text-xs'}>
              {WEEKDAYS_ES[d.getDay()]}
            </span>
          </button>
        )
      })}
    </div>
  )
}

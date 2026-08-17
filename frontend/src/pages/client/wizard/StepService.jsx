// RF03 step 1: service selection.
export function StepService({ services, onSelect }) {
  return (
    <section>
      <h2>Elige un servicio</h2>
      <ul className="flex list-none flex-col gap-2.5 p-0">
        {services.map((service) => (
          <li key={service.id}>
            <button
              type="button"
              className="border-line group flex w-full items-center justify-between gap-3 rounded-xl border border-l-4 bg-white px-4 py-3.5 text-left text-base shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-all duration-150 hover:-translate-y-0.5 hover:shadow-[0_6px_16px_rgba(0,0,0,0.08)]"
              style={{ borderLeftColor: service.color }}
              onClick={() => onSelect(service)}
            >
              <span className="font-medium">{service.name}</span>
              <span className="text-muted text-sm tabular-nums">
                {service.duration_minutes} min · ${service.price}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}

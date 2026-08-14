// RF03 step 1: service selection.
export function StepService({ services, onSelect }) {
  return (
    <section>
      <h2>Elige un servicio</h2>
      <ul className="option-list">
        {services.map((service) => (
          <li key={service.id}>
            <button type="button" onClick={() => onSelect(service)}>
              <span>{service.name}</span>
              <span className="option-meta">
                {service.duration_minutes} min · ${service.price}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}

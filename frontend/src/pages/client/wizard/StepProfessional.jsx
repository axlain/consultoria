// RF03 step 2: professional selection, scoped to those who offer the chosen service.
export function StepProfessional({ professionals, onSelect, onBack }) {
  return (
    <section>
      <h2>Elige un profesional</h2>
      <ul className="option-list">
        {professionals.map((professional) => (
          <li key={professional.id}>
            <button type="button" onClick={() => onSelect(professional)}>
              {professional.name}
            </button>
          </li>
        ))}
        {professionals.length === 0 && <li>No hay profesionales disponibles para este servicio.</li>}
      </ul>
      <button type="button" className="link-button" onClick={onBack}>
        Atrás
      </button>
    </section>
  )
}

import { servicePhoto } from '../../../utils/fallbackImages'

export function StepService({ services, onSelect }) {
  return (
    <section>
      <h2 className="text-xl font-bold text-[#F2EBE0] mb-5">Elige un servicio</h2>
      <ul className="flex list-none flex-col gap-3 p-0">
        {services.map((service) => (
          <li key={service.id}>
            <button
              type="button"
              className="group flex w-full items-center gap-4 rounded-2xl border border-[#2A2520] bg-[#1E1B15] p-3 text-left transition-all duration-150 hover:border-[#C8973E]/50 active:scale-[0.99]"
              onClick={() => onSelect(service)}
            >
              <img
                src={service.image_url || servicePhoto(services.indexOf(service))}
                alt={service.name}
                className="w-16 h-16 rounded-xl object-cover shrink-0 bg-[#2A2520]"
                onError={(e) => { e.currentTarget.style.display = 'none' }}
              />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-[#F2EBE0]">{service.name}</p>
                {service.description && (
                  <p className="text-xs text-[#7A7065] mt-0.5 line-clamp-2">{service.description}</p>
                )}
                <div className="flex items-center gap-3 mt-2">
                  <span className="text-xs text-[#7A7065]">{service.duration_minutes} min</span>
                  <span className="text-xs font-bold text-[#C8973E]">${service.price}</span>
                </div>
              </div>
              <div className="w-5 h-5 rounded-full border-2 border-[#2A2520] group-hover:border-[#C8973E]/60 shrink-0 flex items-center justify-center transition-colors">
                <div className="w-2.5 h-2.5 rounded-full bg-transparent group-hover:bg-[#C8973E]/40 transition-colors" />
              </div>
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}

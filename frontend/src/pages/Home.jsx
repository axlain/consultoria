import { Link } from 'react-router-dom'

export function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#0C0B09] px-6 py-12 text-center relative overflow-hidden">
      <div className="pointer-events-none absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px] rounded-full bg-[#C8973E]/8 blur-[120px]" />

      <div className="relative z-10 w-full max-w-[400px]">
        <div className="mx-auto mb-6 w-12 h-12 rounded-full bg-[#C8973E] flex items-center justify-center">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0C0B09" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="6" cy="6" r="3" /><circle cx="6" cy="18" r="3" />
            <line x1="20" y1="4" x2="8.12" y2="15.88" />
            <line x1="14.47" y1="14.48" x2="20" y2="20" />
            <line x1="8.12" y1="8.12" x2="12" y2="12" />
          </svg>
        </div>
        <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.18em] text-[#C8973E]">
          Demo disponible
        </p>
        <h1 className="mb-2 text-5xl font-extrabold text-[#F2EBE0]">
          Barbería<br />
          <span className="text-[#C8973E]">El Corte</span>
        </h1>
        <p className="mb-8 text-sm text-[#7A7065]">Plataforma de agendamiento</p>

        <div className="flex flex-col gap-3">
          <Link
            to="/demo/barberia"
            className="flex items-center justify-between rounded-2xl border border-[#2A2520] bg-[#1E1B15] px-5 py-4 text-left text-base font-medium text-[#F2EBE0] no-underline transition-all duration-150 hover:border-[#C8973E]/40 hover:bg-[#2A2520]"
          >
            Ver sitio público
            <span className="text-[#7A7065] text-sm font-normal">→</span>
          </Link>
          <Link
            to="/login"
            className="flex items-center justify-between rounded-2xl bg-[#C8973E] px-5 py-4 text-left text-base font-bold text-[#0C0B09] no-underline shadow-[0_8px_24px_rgba(200,151,62,0.25)] transition-all duration-150 hover:bg-[#E8B86D] active:scale-[0.98]"
          >
            Iniciar sesión
            <span className="text-sm font-black">→</span>
          </Link>
        </div>
      </div>
    </div>
  )
}

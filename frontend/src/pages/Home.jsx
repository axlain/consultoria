import { Link } from 'react-router-dom'

// Dev convenience entry point for the seeded demo tenant.
export function Home() {
  return (
    <div className="mx-auto flex min-h-screen max-w-[440px] flex-col justify-center px-6 py-8 text-center">
      <p className="text-muted mb-1 text-xs font-semibold tracking-[0.12em] uppercase">Demo disponible</p>
      <h1 className="mb-6 text-3xl">Barbería El Corte</h1>
      <div className="flex flex-col gap-3">
        <Link
          to="/demo/barberia"
          className="border-line flex items-center justify-between rounded-xl border bg-white px-5 py-4 text-left text-base font-medium text-inherit no-underline shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-all duration-150 hover:-translate-y-0.5 hover:shadow-[0_6px_16px_rgba(0,0,0,0.08)]"
        >
          Ver sitio público
          <span className="text-muted text-sm font-normal">→</span>
        </Link>
        <Link
          to="/login"
          className="flex items-center justify-between rounded-xl border border-[#c9a24b] bg-[#c9a24b] px-5 py-4 text-left text-base font-medium text-white no-underline shadow-sm transition-all duration-150 hover:-translate-y-0.5 hover:opacity-95"
        >
          Iniciar sesión
          <span className="text-sm font-normal">→</span>
        </Link>
      </div>
    </div>
  )
}

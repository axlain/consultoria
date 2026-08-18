import { Link } from 'react-router-dom'

export function Equipo() {
  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#1c1c1e]">Equipo</h1>
        <Link
          to="/panel/equipo/nueva-cita"
          className="rounded-lg bg-[#c9a24b] px-4 py-2 text-sm font-semibold text-white"
        >
          + Nueva cita (walk-in)
        </Link>
      </div>

      <div className="rounded-xl border border-dashed border-[#d1d1d6] p-12 text-center text-[#6e6e73]">
        <p className="text-lg">Agenda del equipo</p>
        <p className="mt-1 text-sm">
          En la Fase 2 verás aquí las citas y disponibilidad de todos los empleados de tu equipo.
        </p>
      </div>
    </div>
  )
}

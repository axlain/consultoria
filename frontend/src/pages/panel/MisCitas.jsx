import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export function MisCitas() {
  const { user } = useAuth()
  // Phase 1: appointments are not yet linked to user accounts. Placeholder UI.
  const [citas] = useState([])

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#1c1c1e]">Mis citas</h1>
        <Link
          to="/demo/barberia/reservar"
          className="rounded-lg bg-[#c9a24b] px-4 py-2 text-sm font-semibold text-white"
        >
          + Agendar nueva
        </Link>
      </div>

      {citas.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[#d1d1d6] p-12 text-center text-[#6e6e73]">
          <p className="text-lg">No tienes citas próximas</p>
          <p className="mt-1 text-sm">Usa el botón de arriba para agendar.</p>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {citas.map(c => (
            <li key={c.id} className="rounded-xl border border-[#d1d1d6] p-4">
              {c.service_id} — {c.date} {c.time}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

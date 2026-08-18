import { useAuth } from '../../context/AuthContext'

export function MiAgenda() {
  const { user } = useAuth()

  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold text-[#1c1c1e]">Mi agenda</h1>
      <p className="mb-6 text-sm text-[#6e6e73]">Bienvenido, {user?.name}</p>

      <div className="rounded-xl border border-dashed border-[#d1d1d6] p-12 text-center text-[#6e6e73]">
        <p className="text-lg">Vista de calendario individual</p>
        <p className="mt-1 text-sm">
          En la Fase 2 verás aquí tus citas asignadas y podrás marcar tu disponibilidad.
        </p>
      </div>
    </div>
  )
}

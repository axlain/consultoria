export function MisRewards() {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-[#1c1c1e]">Mis rewards</h1>
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Puntos acumulados" value="0 pts" />
        <StatCard label="Visitas totales" value="0" />
        <StatCard label="Nivel" value="Nuevo" />
      </div>
      <div className="mt-8 rounded-xl border border-dashed border-[#d1d1d6] p-12 text-center text-[#6e6e73]">
        <p>El programa de rewards estará disponible en la Fase 2.</p>
      </div>
    </div>
  )
}

function StatCard({ label, value }) {
  return (
    <div className="rounded-xl border border-[#d1d1d6] p-5">
      <p className="text-xs text-[#6e6e73]">{label}</p>
      <p className="mt-1 text-2xl font-bold text-[#1c1c1e]">{value}</p>
    </div>
  )
}

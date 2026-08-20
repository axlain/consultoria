import { useAuth } from '../../context/AuthContext'
import { useTenant } from '../../context/TenantContext'
import { ClientShell } from '../../components/ClientShell'
import { HamburgerMenu } from '../../components/HamburgerMenu'

export function MisRewards() {
  const { user } = useAuth()
  const { tenant } = useTenant()
  const slug = tenant?.slug || user?.business_id || 'barberia'

  return (
    <ClientShell wide>
      <HamburgerMenu faqs={tenant?.faqs ?? []} slug={slug} className="lg:hidden" />

      {/* Desktop card: same shared-block language as the rest of the client app. */}
      <div className="md:max-w-2xl md:mx-auto lg:max-w-4xl lg:my-12 lg:rounded-3xl lg:border lg:border-[#2A2520] lg:bg-[#1E1B15] lg:overflow-hidden">
        {/* Unified header bar (desktop only) */}
        <div className="hidden lg:flex lg:items-center lg:justify-between lg:border-b lg:border-[#2A2520] lg:px-8 lg:py-5">
          <h1 className="m-0 text-lg font-bold text-[#F2EBE0]">Mis rewards</h1>
          <HamburgerMenu faqs={tenant?.faqs ?? []} slug={slug} inline />
        </div>

        <div className="px-5 pt-10 pb-10 lg:px-8 lg:pt-8 lg:pb-10">
          <h1 className="mb-6 text-2xl font-extrabold text-[#F2EBE0] pr-14 lg:hidden">Mis rewards</h1>

          <div className="grid gap-3 grid-cols-3 mb-6 lg:gap-4">
            <StatCard label="Puntos acumulados" value="0 pts" />
            <StatCard label="Visitas totales" value="0" />
            <StatCard label="Nivel" value="Nuevo" accent />
          </div>

          <div className="rounded-2xl border border-dashed border-[#2A2520] p-12 text-center">
            <div className="mb-3 text-3xl">⭐</div>
            <p className="text-sm text-[#7A7065] leading-relaxed">
              El programa de rewards estará<br />disponible en la Fase 2.
            </p>
          </div>
        </div>
      </div>
    </ClientShell>
  )
}

function StatCard({ label, value, accent }) {
  return (
    <div className="rounded-2xl border border-[#2A2520] bg-[#1E1B15] p-4">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-[#7A7065] leading-tight mb-2">{label}</p>
      <p className={`text-xl font-bold ${accent ? 'text-[#C8973E]' : 'text-[#F2EBE0]'}`}>{value}</p>
    </div>
  )
}

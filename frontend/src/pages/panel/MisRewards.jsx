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
      <div className="md:max-w-2xl md:mx-auto lg:max-w-4xl lg:my-12 lg:rounded-3xl lg:border lg:border-line lg:bg-surface lg:overflow-hidden">
        {/* Unified header bar (desktop only) */}
        <div className="hidden lg:flex lg:items-center lg:justify-between lg:border-b lg:border-line lg:px-8 lg:py-5">
          <h1 className="m-0 text-lg font-bold text-ink">Mis rewards</h1>
          <HamburgerMenu faqs={tenant?.faqs ?? []} slug={slug} inline />
        </div>

        <div className="px-5 pt-10 pb-10 lg:px-8 lg:pt-8 lg:pb-10">
          <h1 className="mb-6 text-2xl font-extrabold text-ink pr-14 lg:hidden">Mis rewards</h1>

          <div className="grid gap-3 grid-cols-3 mb-6 lg:gap-4">
            <StatCard label="Puntos acumulados" value="0 pts" />
            <StatCard label="Visitas totales" value="0" />
            <StatCard label="Nivel" value="Nuevo" accent />
          </div>

          <div className="rounded-2xl border border-dashed border-line p-12 text-center">
            <div className="mb-3 text-3xl">⭐</div>
            <p className="text-sm text-muted leading-relaxed">
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
    <div className="rounded-2xl border border-line bg-surface p-4">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted leading-tight mb-2">{label}</p>
      <p className={`text-xl font-bold ${accent ? 'text-accent' : 'text-ink'}`}>{value}</p>
    </div>
  )
}

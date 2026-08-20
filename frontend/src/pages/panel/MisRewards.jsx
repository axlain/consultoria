import { useAuth } from '../../context/AuthContext'
import { useTenant } from '../../context/TenantContext'
import { ClientShell } from '../../components/ClientShell'
import { HamburgerMenu } from '../../components/HamburgerMenu'

export function MisRewards() {
  const { user } = useAuth()
  const { tenant } = useTenant()
  const slug = tenant?.slug || user?.business_id || 'barberia'

  return (
    <ClientShell>
      <HamburgerMenu faqs={tenant?.faqs ?? []} slug={slug} />

      <div className="px-5 pt-10">
        <h1 className="mb-6 text-2xl font-extrabold text-[#F2EBE0] pr-14">Mis rewards</h1>

        <div className="grid gap-3 grid-cols-3 mb-6">
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

      {/* Bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 mx-auto max-w-[430px] flex border-t border-[#2A2520] bg-[#0C0B09]">
        {[
          { to: `/demo/${slug}`, label: 'Inicio', icon: '🏠' },
          { to: `/panel/mis-citas`, label: 'Mis citas', icon: '📅' },
          { to: `/panel/mis-rewards`, label: 'Rewards', icon: '⭐', active: true },
          { to: `/login`, label: 'Perfil', icon: '👤' },
        ].map(({ to, label, icon, active }) => (
          <a
            key={to}
            href={to}
            className={[
              'flex flex-1 flex-col items-center gap-1 py-3 text-[10px] font-semibold no-underline transition-colors',
              active ? 'text-[#C8973E]' : 'text-[#7A7065] hover:text-[#F2EBE0]',
            ].join(' ')}
          >
            <span className="text-xl leading-none">{icon}</span>
            {label}
          </a>
        ))}
      </nav>
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

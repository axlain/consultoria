import { useAuth } from '../../context/AuthContext'
import { TenantProvider, useTenant } from '../../context/TenantContext'

function ClientPanelGateInner({ children }) {
  const { status } = useTenant()
  if (status !== 'ready') {
    return <div className="mx-auto max-w-[600px] py-8 px-6 text-center">Cargando…</div>
  }
  return children
}

// Wraps the client-facing panel pages (Mis citas / Mis rewards) in the same
// TenantProvider the rest of the client app uses, so they can render inside
// ClientShell + HamburgerMenu instead of the desktop admin sidebar (PanelLayout).
export function ClientPanelGate({ children }) {
  const { user } = useAuth()
  return (
    <TenantProvider slug={user?.business_id || 'levisalon-keratinas'}>
      <ClientPanelGateInner>{children}</ClientPanelGateInner>
    </TenantProvider>
  )
}

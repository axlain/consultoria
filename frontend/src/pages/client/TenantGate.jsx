import { Outlet, useParams } from 'react-router-dom'
import { TenantProvider, useTenant } from '../../context/TenantContext'
import { NotFound } from '../NotFound'

function TenantGateInner() {
  const { status } = useTenant()

  if (status === 'loading') return <div className="mx-auto max-w-[600px] py-8 px-6 text-center">Cargando...</div>
  if (status === 'not-found') return <NotFound />
  if (status === 'error') {
    return (
      <div className="mx-auto max-w-[600px] py-8 px-6 text-center">
        Ocurrió un error al cargar el negocio. Intenta de nuevo más tarde.
      </div>
    )
  }

  return <Outlet />
}

// RF01: everything under /demo/:slug resolves its tenant here before rendering.
export function TenantGate() {
  const { slug } = useParams()
  return (
    <TenantProvider slug={slug}>
      <TenantGateInner />
    </TenantProvider>
  )
}

import { Link } from 'react-router-dom'
import { useTenant } from '../../context/TenantContext'

// RF07: redirect target after a successful booking.
export function ThankYou() {
  const { tenant } = useTenant()

  return (
    <div className="client-shell page-status">
      <h1>¡Gracias! Tu cita está confirmada</h1>
      <p>Te esperamos en {tenant.business.name}.</p>
      <Link to={`/demo/${tenant.slug}`}>Volver al inicio</Link>
    </div>
  )
}

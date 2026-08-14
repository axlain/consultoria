import { Link } from 'react-router-dom'

// RF07: CTA pinned to the mobile screen at all times on the client-facing pages.
export function StickyCta({ slug, label = 'Agendar ahora' }) {
  return (
    <Link to={`/demo/${slug}/reservar`} className="sticky-cta">
      {label}
    </Link>
  )
}

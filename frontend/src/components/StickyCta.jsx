import { Link } from 'react-router-dom'

// RF07: CTA pinned to the mobile screen at all times on the client-facing pages.
export function StickyCta({ slug, label = 'Agendar ahora' }) {
  return (
    <Link
      to={`/demo/${slug}/reservar`}
      className="bg-secondary fixed bottom-4 left-1/2 z-30 w-[calc(100%-2rem)] max-w-[400px] -translate-x-1/2 rounded-full py-[0.95rem] text-center font-semibold tracking-wide text-white no-underline shadow-[0_8px_24px_rgba(0,0,0,0.25)] transition-transform duration-150 hover:scale-[1.02] active:scale-[0.98] md:max-w-[320px]"
    >
      {label}
    </Link>
  )
}

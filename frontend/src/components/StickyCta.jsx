import { Link } from 'react-router-dom'

// RF07: sticky bottom CTA on client-facing pages.
export function StickyCta({ slug, label = 'Reservar cita' }) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 mx-auto max-w-[430px] px-5 pb-6 pt-3 bg-gradient-to-t from-[#0C0B09] via-[#0C0B09]/95 to-transparent md:hidden">
      <Link
        to={`/demo/${slug}/reservar`}
        className="block w-full rounded-2xl bg-[#C8973E] py-[1rem] text-center font-bold text-base text-[#0C0B09] no-underline shadow-lg shadow-[#C8973E]/20 transition-all duration-150 hover:bg-[#E8B86D] active:scale-[0.98]"
      >
        {label}
      </Link>
    </div>
  )
}

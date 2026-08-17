// Shared page frame for the client-facing screens: phone-width card on mobile,
// centered panel on desktop. `reserveCta` leaves room for a fixed StickyCta.
export function ClientShell({ children, reserveCta = false, center = false, className = '' }) {
  return (
    <div
      className={[
        'relative mx-auto min-h-screen min-w-[320px] max-w-[450px] bg-white px-4 pt-8',
        reserveCta ? 'pb-24' : 'pb-10',
        'md:my-16 md:min-h-0 md:max-w-4xl md:rounded-2xl md:px-12 md:pt-12 md:pb-16 md:shadow-[0_8px_32px_rgba(0,0,0,0.06)]',
        center ? 'text-center' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </div>
  )
}

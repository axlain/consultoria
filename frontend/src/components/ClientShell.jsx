export function ClientShell({ children, reserveCta = false, center = false, wide = false, className = '' }) {
  return (
    <div
      className={[
        'relative mx-auto min-h-screen min-w-[320px] max-w-[430px] bg-[#0C0B09]',
        reserveCta ? (wide ? 'pb-28 md:pb-10' : 'pb-28') : 'pb-10',
        wide
          ? 'md:my-0 md:min-h-screen md:max-w-6xl md:rounded-none md:border-0 md:shadow-none md:overflow-visible'
          : 'md:my-12 md:min-h-0 md:max-w-[430px] md:rounded-3xl md:border md:border-[#2A2520] md:shadow-[0_24px_64px_rgba(0,0,0,0.7)] md:overflow-hidden',
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

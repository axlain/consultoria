import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import QRCode from 'qrcode'
import { useTenant } from '../../context/TenantContext'
import { ClientShell } from '../../components/ClientShell'

// RF07: redirect target after a successful booking. The wizard's navigate() call
// carries the created appointment in router state, which is what renders the QR
// ticket below — there's no backend lookup by id, so a direct visit/refresh here
// (no state) just skips the ticket instead of erroring.
export function ThankYou() {
  const { tenant } = useTenant()
  const location = useLocation()
  const { appointment } = location.state || {}
  const [qrDataUrl, setQrDataUrl] = useState(null)

  useEffect(() => {
    if (!appointment) return
    let cancelled = false

    // The QR only encodes the appointment id — the front-desk scanner looks up
    // the rest (name/service/time) from the backend, so it always reflects the
    // appointment's current state instead of a snapshot baked in at booking time.
    QRCode.toDataURL(appointment.id, { width: 220, margin: 1 })
      .then((url) => {
        if (!cancelled) setQrDataUrl(url)
      })
      .catch(() => {})

    return () => {
      cancelled = true
    }
  }, [appointment])

  return (
    <ClientShell center className="flex flex-col items-center justify-center">
      <div className="motion-safe:animate-fade-in">
        <svg
          width="56"
          height="56"
          viewBox="0 0 56 56"
          fill="none"
          aria-hidden="true"
          className="text-secondary mx-auto mb-5"
        >
          <circle cx="28" cy="28" r="26" stroke="currentColor" strokeWidth="2.5" opacity="0.3" />
          <path
            d="M17 29.5 24 36.5 39 20.5"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <h1>¡Listo! Tu cita está confirmada</h1>
        <p className="text-muted mt-2">Te esperamos en {tenant.business.name}.</p>

        {qrDataUrl && (
          <div className="border-line mx-auto mt-7 flex w-fit flex-col items-center gap-3 rounded-2xl border bg-white p-5">
            <img src={qrDataUrl} alt="Código QR de tu cita" width={200} height={200} className="rounded-lg" />
            <p className="text-muted max-w-[240px] text-xs">
              Muéstralo al llegar al local. Descárgalo o, si prefieres, toma una captura de pantalla como respaldo.
            </p>
            <a
              href={qrDataUrl}
              download={`cita-${appointment.id}.png`}
              className="bg-secondary rounded-full px-5 py-2.5 text-sm font-semibold text-white no-underline transition-transform duration-150 hover:scale-[1.02] active:scale-[0.98]"
            >
              Descargar comprobante
            </a>
          </div>
        )}

        <Link
          to={`/demo/${tenant.slug}`}
          className="border-line hover:border-secondary mt-7 inline-block rounded-full border px-5 py-2.5 text-sm font-semibold text-inherit no-underline transition-colors"
        >
          Volver al inicio
        </Link>
      </div>
    </ClientShell>
  )
}

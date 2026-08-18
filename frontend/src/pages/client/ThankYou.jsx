import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import QRCode from 'qrcode'
import { useTenant } from '../../context/TenantContext'
import { ClientShell } from '../../components/ClientShell'
import { HamburgerMenu } from '../../components/HamburgerMenu'

// Fetch the JWT-signed QR URL from the backend (mirrors @consultoria/qr generateAppointmentQr).
async function fetchQrUrl(slug, aptId) {
  const baseUrl = window.location.origin
  const res = await fetch(
    `/api/tenants/${slug}/appointments/${aptId}/qr?base_url=${encodeURIComponent(baseUrl)}`
  )
  if (!res.ok) return null
  const data = await res.json()
  return data.url
}

export function ThankYou() {
  const { tenant } = useTenant()
  const location = useLocation()
  const { appointment, payment } = location.state || {}
  const [qrDataUrl, setQrDataUrl] = useState(null)
  const [qrTargetUrl, setQrTargetUrl] = useState(null)

  useEffect(() => {
    if (!appointment) return
    let cancelled = false

    fetchQrUrl(tenant.slug, appointment.id)
      .then(async (url) => {
        if (cancelled || !url) return
        setQrTargetUrl(url)
        const dataUrl = await QRCode.toDataURL(url, { width: 220, margin: 1 })
        if (!cancelled) setQrDataUrl(dataUrl)
      })
      .catch(() => {})

    return () => { cancelled = true }
  }, [appointment, tenant.slug])

  return (
    <ClientShell center className="flex flex-col items-center justify-center">
      <HamburgerMenu faqs={tenant.faqs} slug={tenant.slug} />

      <div className="motion-safe:animate-fade-in">
        <svg
          width="56" height="56" viewBox="0 0 56 56" fill="none"
          aria-hidden="true" className="text-secondary mx-auto mb-5"
        >
          <circle cx="28" cy="28" r="26" stroke="currentColor" strokeWidth="2.5" opacity="0.3" />
          <path d="M17 29.5 24 36.5 39 20.5" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>

        <h1>¡Listo! Tu cita está confirmada</h1>
        <p className="text-muted mt-2">Te esperamos en {tenant.business.name}.</p>

        {payment && (
          <div className={`mt-4 rounded-lg px-4 py-2 text-sm font-medium ${
            payment.status === 'paid' ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700'
          }`}>
            {payment.status === 'paid' ? '✓ Pago confirmado' : `Pago pendiente (${payment.status})`}
          </div>
        )}

        {qrDataUrl && (
          <div className="border-line mx-auto mt-7 flex w-fit flex-col items-center gap-3 rounded-2xl border bg-white p-5">
            <img src={qrDataUrl} alt="Código QR de tu cita" width={200} height={200} className="rounded-lg" />
            <p className="text-muted max-w-[240px] text-xs text-center">
              Muéstralo al llegar al local para hacer check-in. Toma una captura como respaldo.
            </p>
            {qrTargetUrl && (
              <Link
                to={new URL(qrTargetUrl).pathname + new URL(qrTargetUrl).search}
                className="text-xs text-[#c9a24b] hover:underline"
              >
                Ver detalles de la cita →
              </Link>
            )}
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

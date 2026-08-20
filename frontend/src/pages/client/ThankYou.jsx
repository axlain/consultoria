import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import QRCode from 'qrcode'
import { useTenant } from '../../context/TenantContext'
import { ClientShell } from '../../components/ClientShell'
import { HamburgerMenu } from '../../components/HamburgerMenu'

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
        const dataUrl = await QRCode.toDataURL(url, {
          width: 220,
          margin: 1,
          color: { dark: '#0C0B09', light: '#C8973E' },
        })
        if (!cancelled) setQrDataUrl(dataUrl)
      })
      .catch(() => {})

    return () => { cancelled = true }
  }, [appointment, tenant.slug])

  return (
    <ClientShell center className="flex flex-col items-center justify-center">
      <HamburgerMenu faqs={tenant.faqs} slug={tenant.slug} />

      <div className="motion-safe:animate-fade-in px-5 py-10 w-full">
        {/* Success icon */}
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full border-2 border-[#10B981] bg-[#10B981]/15">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </div>

        <h1 className="text-3xl font-extrabold text-[#F2EBE0] mb-2">¡Cita confirmada!</h1>
        <p className="text-sm text-[#7A7065]">Te esperamos en {tenant.business.name}.</p>

        {payment && (
          <div className={`mt-4 rounded-xl border px-4 py-2 text-sm font-semibold ${
            payment.status === 'paid'
              ? 'border-[#10B981]/30 bg-[#10B981]/10 text-[#10B981]'
              : 'border-yellow-500/20 bg-yellow-500/10 text-yellow-400'
          }`}>
            {payment.status === 'paid' ? '✓ Pago confirmado' : `Pago pendiente (${payment.status})`}
          </div>
        )}

        {appointment && (
          <div className="mt-5 rounded-2xl border border-[#2A2520] bg-[#1E1B15] p-4 text-left">
            <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-2 text-sm">
              <dt className="text-[#7A7065]">Fecha</dt>
              <dd className="m-0 text-right font-medium text-[#F2EBE0]">{appointment.date}</dd>
              <dt className="text-[#7A7065]">Hora</dt>
              <dd className="m-0 text-right font-medium text-[#F2EBE0]">{appointment.time}</dd>
              {appointment.id && (
                <>
                  <dt className="text-[#7A7065]">Ref.</dt>
                  <dd className="m-0 text-right font-mono text-xs text-[#7A7065]">#{appointment.id.slice(-8)}</dd>
                </>
              )}
            </dl>
          </div>
        )}

        {qrDataUrl && (
          <div className="mx-auto mt-6 flex w-fit flex-col items-center gap-3 rounded-2xl border border-[#2A2520] bg-[#1E1B15] p-5">
            <div className="flex items-center justify-center gap-2 text-[#C8973E] mb-1">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
                <rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="4" height="4"/>
                <line x1="20" y1="14" x2="20" y2="14"/><line x1="20" y1="20" x2="20" y2="20"/>
              </svg>
              <span className="text-xs font-semibold text-[#7A7065]">Código QR de tu cita</span>
            </div>
            <img src={qrDataUrl} alt="Código QR de tu cita" width={200} height={200} className="rounded-xl" />
            <p className="max-w-[240px] text-center text-xs text-[#7A7065]">
              Muéstralo al llegar al local para hacer check-in.
            </p>
            {qrTargetUrl && (
              <Link
                to={new URL(qrTargetUrl).pathname + new URL(qrTargetUrl).search}
                className="text-xs text-[#C8973E] hover:opacity-80 transition-opacity"
              >
                Ver detalles de la cita →
              </Link>
            )}
            <a
              href={qrDataUrl}
              download={`cita-${appointment.id}.png`}
              className="rounded-2xl bg-[#C8973E] px-5 py-2.5 text-sm font-bold text-[#0C0B09] no-underline transition-all hover:bg-[#E8B86D] active:scale-[0.98]"
            >
              Descargar comprobante
            </a>
          </div>
        )}

        <Link
          to={`/demo/${tenant.slug}`}
          className="mt-7 inline-block w-full rounded-2xl border border-[#2A2520] px-5 py-3 text-sm font-semibold text-[#F2EBE0] no-underline text-center transition-colors hover:border-[#C8973E]/40"
        >
          Volver al inicio
        </Link>
      </div>
    </ClientShell>
  )
}

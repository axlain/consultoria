import { useEffect, useRef, useState } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import { api } from '../../api/client'

const READER_ID = 'qr-reader-region'

// Front-desk check-in: scans the QR ticket from ThankYou.jsx (which encodes only the
// appointment id), validates it against the backend, and lets staff mark it completed.
export function QrScannerModal({ tenantSlug, onClose }) {
  const scannerRef = useRef(null)
  const [scanning, setScanning] = useState(true)
  const [cameraError, setCameraError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [validationError, setValidationError] = useState(null)
  const [completing, setCompleting] = useState(false)
  const [completed, setCompleted] = useState(false)

  useEffect(() => {
    if (!scanning) return
    let cancelled = false
    const html5QrCode = new Html5Qrcode(READER_ID)
    scannerRef.current = html5QrCode

    html5QrCode
      .start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: 240 },
        (decodedText) => {
          if (!cancelled) handleScan(decodedText)
        },
        () => {}, // per-frame "no code found yet" — expected, not an error
      )
      .catch(() => {
        if (!cancelled) setCameraError('No se pudo acceder a la cámara. Revisa los permisos del navegador.')
      })

    return () => {
      cancelled = true
      stopCamera()
    }
  }, [scanning])

  async function stopCamera() {
    const instance = scannerRef.current
    if (!instance) return
    try {
      await instance.stop()
      await instance.clear()
    } catch {
      // already stopped/cleared — nothing to do
    }
  }

  async function handleScan(decodedText) {
    await stopCamera()
    setScanning(false)
    setCameraError(null)
    setLoading(true)
    setValidationError(null)
    try {
      const appointment = await api.validateAppointment(tenantSlug, decodedText.trim())
      setResult(appointment)
    } catch (err) {
      setValidationError(err.message)
    } finally {
      setLoading(false)
    }
  }

  function handleScanAgain() {
    setResult(null)
    setValidationError(null)
    setCompleted(false)
    setScanning(true)
  }

  async function handleComplete() {
    if (!result) return
    setCompleting(true)
    setValidationError(null)
    try {
      await api.updateAppointment(tenantSlug, result.id, { status: 'completed' })
      setCompleted(true)
    } catch (err) {
      setValidationError(err.message)
    } finally {
      setCompleting(false)
    }
  }

  async function handleClose() {
    await stopCamera()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 p-4" onClick={handleClose}>
      <div className="w-full max-w-sm rounded-2xl border border-line bg-surface-alt p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="m-0 border-0 p-0 text-lg font-bold text-ink">Escanear código QR</h2>
          <button
            type="button"
            className="border-0 bg-transparent p-1 text-[1.5rem] leading-none text-muted hover:text-ink transition-colors"
            aria-label="Cerrar"
            onClick={handleClose}
          >
            ×
          </button>
        </div>

        {scanning && (
          <>
            <div id={READER_ID} className="min-h-[250px] overflow-hidden rounded-xl bg-black" />
            {cameraError ? (
              <p className="mt-3 text-sm text-red-400">{cameraError}</p>
            ) : (
              <p className="mt-3 text-center text-xs text-muted">Apunta la cámara al código QR del cliente.</p>
            )}
          </>
        )}

        {!scanning && loading && (
          <div className="flex flex-col items-center gap-3 py-10">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-line border-t-accent" />
            <p className="text-sm text-muted">Validando código...</p>
          </div>
        )}

        {!scanning && !loading && validationError && (
          <div className="py-6 text-center">
            <p className="mb-4 text-sm font-medium text-red-400">{validationError}</p>
            <button
              type="button"
              className="rounded-2xl bg-accent px-5 py-2.5 text-sm font-semibold text-[#0C0B09] hover:bg-accent-light transition-colors"
              onClick={handleScanAgain}
            >
              Escanear otro código
            </button>
          </div>
        )}

        {!scanning && !loading && result && !completed && (
          <div>
            <div className="rounded-xl border border-line bg-paper p-4">
              <p className="text-lg font-semibold text-ink">
                {result.customer_name} {result.customer_last_name}
              </p>
              <p className="mt-1 text-sm text-muted">
                {result.service_name} · {result.professional_name}
              </p>
              <p className="text-sm text-muted">
                {result.date} · {result.time}
              </p>
            </div>
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                className="flex-1 rounded-2xl border border-line py-2.5 text-sm font-semibold text-muted hover:border-accent/40 hover:text-ink transition-colors"
                onClick={handleScanAgain}
              >
                Escanear otro
              </button>
              <button
                type="button"
                className="flex-1 rounded-2xl bg-accent py-2.5 text-sm font-semibold text-[#0C0B09] hover:bg-accent-light transition-colors disabled:opacity-50"
                onClick={handleComplete}
                disabled={completing}
              >
                {completing ? 'Guardando...' : 'Marcar completada'}
              </button>
            </div>
          </div>
        )}

        {completed && (
          <div className="py-6 text-center">
            <p className="mb-4 text-sm font-medium text-[#10B981]">Cita marcada como completada ✓</p>
            <button
              type="button"
              className="rounded-2xl bg-accent px-5 py-2.5 text-sm font-semibold text-[#0C0B09] hover:bg-accent-light transition-colors"
              onClick={handleScanAgain}
            >
              Escanear otra cita
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

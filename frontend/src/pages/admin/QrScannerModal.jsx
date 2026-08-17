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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 p-4" onClick={handleClose}>
      <div className="w-full max-w-sm rounded-2xl bg-white p-6" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="m-0 border-0 p-0">Escanear código QR</h2>
          <button
            type="button"
            className="border-0 bg-transparent p-1 text-[1.5rem] leading-none text-primary"
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
              <p className="mt-3 text-sm text-[#c0392b]">{cameraError}</p>
            ) : (
              <p className="text-muted mt-3 text-center text-xs">Apunta la cámara al código QR del cliente.</p>
            )}
          </>
        )}

        {!scanning && loading && (
          <div className="flex flex-col items-center gap-3 py-10">
            <div className="border-line h-8 w-8 animate-spin rounded-full border-2 border-t-secondary" />
            <p className="text-muted text-sm">Validando código...</p>
          </div>
        )}

        {!scanning && !loading && validationError && (
          <div className="py-6 text-center">
            <p className="mb-4 text-sm font-medium text-[#c0392b]">{validationError}</p>
            <button
              type="button"
              className="bg-secondary rounded-full px-5 py-2.5 text-sm font-semibold text-white"
              onClick={handleScanAgain}
            >
              Escanear otro código
            </button>
          </div>
        )}

        {!scanning && !loading && result && !completed && (
          <div>
            <div className="border-line rounded-xl border p-4">
              <p className="text-lg font-semibold">
                {result.customer_name} {result.customer_last_name}
              </p>
              <p className="text-muted mt-1 text-sm">
                {result.service_name} · {result.professional_name}
              </p>
              <p className="text-muted text-sm">
                {result.date} · {result.time}
              </p>
            </div>
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                className="border-line flex-1 rounded-full border py-2.5 text-sm font-semibold"
                onClick={handleScanAgain}
              >
                Escanear otro
              </button>
              <button
                type="button"
                className="bg-secondary flex-1 rounded-full py-2.5 text-sm font-semibold text-white disabled:opacity-50"
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
            <p className="mb-4 text-sm font-medium text-[#2f9e44]">Cita marcada como completada ✓</p>
            <button
              type="button"
              className="bg-secondary rounded-full px-5 py-2.5 text-sm font-semibold text-white"
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

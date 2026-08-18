import jwt from 'jsonwebtoken'
import QRCode from 'qrcode'

export interface QrConfig {
  signingSecret: string
  baseUrl: string          // e.g. "https://tudominio.com"
}

export interface AppointmentQrResult {
  url: string
  qrImageDataUrl: string   // data:image/png;base64,... — ready for <img src>
}

export async function generateAppointmentQr(
  appointmentId: string,
  expiresAt: Date,
  config: QrConfig
): Promise<AppointmentQrResult> {
  const secondsUntilExpiry = Math.floor((expiresAt.getTime() - Date.now()) / 1000)
  if (secondsUntilExpiry <= 0) throw new Error('expiresAt must be in the future')

  const token = jwt.sign(
    { appointmentId },
    config.signingSecret,
    { expiresIn: secondsUntilExpiry }
  )

  const url = `${config.baseUrl}/cita/${appointmentId}?t=${token}`
  const qrImageDataUrl = await QRCode.toDataURL(url, { width: 300, margin: 1 })

  return { url, qrImageDataUrl }
}

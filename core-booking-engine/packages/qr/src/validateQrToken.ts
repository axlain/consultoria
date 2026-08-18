import jwt from 'jsonwebtoken'

export interface QrTokenPayload {
  appointmentId: string
  iat: number
  exp: number
}

export type QrValidationResult =
  | { valid: true; appointmentId: string }
  | { valid: false; reason: 'expired' | 'invalid' | 'mismatch' }

export function validateQrToken(
  token: string,
  appointmentIdFromPath: string,
  signingSecret: string
): QrValidationResult {
  let payload: QrTokenPayload

  try {
    payload = jwt.verify(token, signingSecret) as QrTokenPayload
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) return { valid: false, reason: 'expired' }
    return { valid: false, reason: 'invalid' }
  }

  // Prevent tokens for one appointment being used on another.
  if (payload.appointmentId !== appointmentIdFromPath) {
    return { valid: false, reason: 'mismatch' }
  }

  return { valid: true, appointmentId: payload.appointmentId }
}

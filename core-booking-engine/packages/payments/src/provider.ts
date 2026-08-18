export type PaymentStatus =
  | 'pending'
  | 'authorized'
  | 'paid'
  | 'failed'
  | 'refunded'
  | 'canceled'

export interface CreatePaymentInput {
  appointmentId: string
  businessId: string
  amountCents: number
  currency: string
}

export interface PaymentResult {
  paymentId: string
  status: PaymentStatus
  providerReference?: string
}

export interface PaymentProvider {
  createPayment(input: CreatePaymentInput): Promise<PaymentResult>
  confirmPayment(paymentId: string): Promise<PaymentResult>
  refundPayment(paymentId: string): Promise<PaymentResult>
}

// Valid state transitions — no skipping steps.
export const VALID_TRANSITIONS: Record<PaymentStatus, PaymentStatus[]> = {
  pending:    ['authorized', 'failed'],
  authorized: ['paid', 'refunded', 'failed'],
  paid:       ['refunded'],
  failed:     [],
  refunded:   [],
  canceled:   [],
}

export function assertValidTransition(current: PaymentStatus, next: PaymentStatus): void {
  if (!VALID_TRANSITIONS[current].includes(next)) {
    throw new Error(`Transición inválida: ${current} → ${next}`)
  }
}

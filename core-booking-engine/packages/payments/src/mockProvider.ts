import { SupabaseClient } from '@supabase/supabase-js'
import {
  CreatePaymentInput,
  PaymentProvider,
  PaymentResult,
  assertValidTransition,
} from './provider'
import {
  dbAddPaymentEvent,
  dbCreatePayment,
  dbGetPayment,
  dbUpdatePaymentStatus,
} from './db'

// Phase 1 — simulates the full payment flow without charging real money.
// Swap this class for StripeProvider or MercadoPagoProvider in Phase 3.
export class MockPaymentProvider implements PaymentProvider {
  constructor(private readonly db: SupabaseClient) {}

  async createPayment(input: CreatePaymentInput): Promise<PaymentResult> {
    const row = await dbCreatePayment(this.db, {
      appointment_id: input.appointmentId,
      business_id: input.businessId,
      amount_cents: input.amountCents,
      currency: input.currency,
      status: 'pending',
      provider: 'mock',
      provider_reference: null,
    })
    await dbAddPaymentEvent(this.db, row.id, 'created', { simulated: true })
    return { paymentId: row.id, status: 'pending' }
  }

  async confirmPayment(paymentId: string): Promise<PaymentResult> {
    const row = await dbGetPayment(this.db, paymentId)
    if (!row) throw new Error(`Pago ${paymentId} no encontrado`)

    assertValidTransition(row.status, 'authorized')
    await dbUpdatePaymentStatus(this.db, paymentId, 'authorized')
    await dbAddPaymentEvent(this.db, paymentId, 'authorized', { simulated: true })

    assertValidTransition('authorized', 'paid')
    await dbUpdatePaymentStatus(this.db, paymentId, 'paid')
    await dbAddPaymentEvent(this.db, paymentId, 'captured', { simulated: true })

    return { paymentId, status: 'paid' }
  }

  async refundPayment(paymentId: string): Promise<PaymentResult> {
    const row = await dbGetPayment(this.db, paymentId)
    if (!row) throw new Error(`Pago ${paymentId} no encontrado`)

    assertValidTransition(row.status, 'refunded')
    await dbUpdatePaymentStatus(this.db, paymentId, 'refunded')
    await dbAddPaymentEvent(this.db, paymentId, 'refunded', { simulated: true })

    return { paymentId, status: 'refunded' }
  }
}

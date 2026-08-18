import { SupabaseClient } from '@supabase/supabase-js'
import { CreatePaymentInput, PaymentProvider, PaymentResult } from './provider'

// TODO Phase 3: implement using the MercadoPago Node SDK.
// npm install mercadopago
export class MercadoPagoProvider implements PaymentProvider {
  constructor(
    private readonly db: SupabaseClient,
    private readonly accessToken: string
  ) {}

  async createPayment(_input: CreatePaymentInput): Promise<PaymentResult> {
    throw new Error('MercadoPagoProvider not yet implemented — use MockPaymentProvider in Phase 1')
  }

  async confirmPayment(_paymentId: string): Promise<PaymentResult> {
    throw new Error('MercadoPagoProvider not yet implemented')
  }

  async refundPayment(_paymentId: string): Promise<PaymentResult> {
    throw new Error('MercadoPagoProvider not yet implemented')
  }
}

import { SupabaseClient } from '@supabase/supabase-js'
import { CreatePaymentInput, PaymentProvider, PaymentResult } from './provider'

// TODO Phase 3: implement using the Stripe Node SDK.
// npm install stripe
// import Stripe from 'stripe'
export class StripeProvider implements PaymentProvider {
  constructor(
    private readonly db: SupabaseClient,
    private readonly secretKey: string
  ) {}

  async createPayment(_input: CreatePaymentInput): Promise<PaymentResult> {
    throw new Error('StripeProvider not yet implemented — use MockPaymentProvider in Phase 1')
  }

  async confirmPayment(_paymentId: string): Promise<PaymentResult> {
    throw new Error('StripeProvider not yet implemented')
  }

  async refundPayment(_paymentId: string): Promise<PaymentResult> {
    throw new Error('StripeProvider not yet implemented')
  }
}

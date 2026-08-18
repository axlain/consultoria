import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { PaymentStatus } from './provider'

export interface DbConfig {
  supabaseUrl: string
  supabaseKey: string
}

export interface PaymentRow {
  id: string
  appointment_id: string
  business_id: string
  amount_cents: number
  currency: string
  status: PaymentStatus
  provider: string
  provider_reference: string | null
  created_at: string
  updated_at: string
}

export function createDbClient(config: DbConfig): SupabaseClient {
  return createClient(config.supabaseUrl, config.supabaseKey)
}

export async function dbCreatePayment(
  client: SupabaseClient,
  data: Omit<PaymentRow, 'id' | 'created_at' | 'updated_at'>
): Promise<PaymentRow> {
  const { data: row, error } = await client
    .from('payments')
    .insert(data)
    .select()
    .single()
  if (error) throw new Error(error.message)
  return row
}

export async function dbGetPayment(
  client: SupabaseClient,
  paymentId: string
): Promise<PaymentRow | null> {
  const { data } = await client
    .from('payments')
    .select()
    .eq('id', paymentId)
    .single()
  return data ?? null
}

export async function dbUpdatePaymentStatus(
  client: SupabaseClient,
  paymentId: string,
  status: PaymentStatus
): Promise<void> {
  const { error } = await client
    .from('payments')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', paymentId)
  if (error) throw new Error(error.message)
}

export async function dbAddPaymentEvent(
  client: SupabaseClient,
  paymentId: string,
  eventType: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  const { error } = await client
    .from('payment_events')
    .insert({ payment_id: paymentId, event_type: eventType, metadata })
  if (error) throw new Error(error.message)
}

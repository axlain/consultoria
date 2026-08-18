export interface MessageInput {
  to: string
  templateId: string       // e.g. "appointment_confirmation" | "payment_receipt" | "cancellation"
  variables: Record<string, string>
  channel?: 'email' | 'whatsapp' | 'sms'
}

export interface MessageResult {
  status: 'sent' | 'failed'
  providerId?: string
  error?: string
}

export interface MessageProvider {
  send(input: MessageInput): Promise<MessageResult>
}

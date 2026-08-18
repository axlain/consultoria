import { MessageInput, MessageProvider, MessageResult } from './provider'

// Logs the message to console instead of sending it.
// Used in development and Phase 1. Swap for EmailProvider / WhatsappProvider in production.
export class MockMessageProvider implements MessageProvider {
  async send(input: MessageInput): Promise<MessageResult> {
    console.log('[MockMessageProvider] Mensaje simulado:', {
      to: input.to,
      template: input.templateId,
      channel: input.channel ?? 'mock',
      variables: input.variables,
    })
    return { status: 'sent', providerId: `mock-${Date.now()}` }
  }
}

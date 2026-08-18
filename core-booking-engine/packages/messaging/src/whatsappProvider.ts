import { MessageInput, MessageProvider, MessageResult } from './provider'

export interface WhatsappConfig {
  accountSid: string    // Twilio Account SID or BSP credentials
  authToken: string
  fromNumber: string    // WhatsApp-enabled number, e.g. "whatsapp:+521XXXXXXXXXX"
}

// TODO: implement using Twilio (npm install twilio) or 360dialog.
export class WhatsappProvider implements MessageProvider {
  constructor(private readonly config: WhatsappConfig) {}

  async send(_input: MessageInput): Promise<MessageResult> {
    // Example with Twilio:
    // const client = twilio(this.config.accountSid, this.config.authToken)
    // const msg = await client.messages.create({
    //   from: this.config.fromNumber,
    //   to: `whatsapp:${input.to}`,
    //   body: templates[input.templateId](input.variables),
    // })
    throw new Error('WhatsappProvider not yet implemented')
  }
}

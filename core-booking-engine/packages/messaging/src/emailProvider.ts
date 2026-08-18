import { MessageInput, MessageProvider, MessageResult } from './provider'

export interface EmailConfig {
  apiKey: string          // Resend / SendGrid API key
  fromAddress: string     // e.g. "no-reply@tudominio.com"
}

// TODO: implement using Resend (npm install resend) or SendGrid (npm install @sendgrid/mail).
export class EmailProvider implements MessageProvider {
  constructor(private readonly config: EmailConfig) {}

  async send(_input: MessageInput): Promise<MessageResult> {
    // Example with Resend:
    // const resend = new Resend(this.config.apiKey)
    // const { data, error } = await resend.emails.send({
    //   from: this.config.fromAddress,
    //   to: [input.to],
    //   subject: templates[input.templateId].subject(input.variables),
    //   html: templates[input.templateId].html(input.variables),
    // })
    throw new Error('EmailProvider not yet implemented')
  }
}

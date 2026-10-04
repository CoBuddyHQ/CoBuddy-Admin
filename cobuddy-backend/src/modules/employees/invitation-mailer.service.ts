import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

export type InvitationDelivery = 'SENT' | 'NOT_CONFIGURED' | 'FAILED';

@Injectable()
export class InvitationMailer {
  private readonly logger = new Logger(InvitationMailer.name);
  constructor(private config: ConfigService) {}

  async send(id: string, email: string, token: string): Promise<InvitationDelivery> {
    const apiKey = this.config.get<string>('RESEND_API_KEY');
    if (!apiKey) return 'NOT_CONFIGURED';
    try {
      const url = new URL(
        '/accept-invite',
        this.config.get<string>('FRONTEND_URL') || 'http://localhost:3000',
      );
      // Fragments are not sent to HTTP servers or included in referrer headers.
      url.hash = new URLSearchParams({ id, token }).toString();
      const resend = new Resend(apiKey);
      const result = await resend.emails.send({
        from: `${this.config.get<string>('EMAIL_FROM_NAME') || 'CoBuddy Admin'} <${this.config.get<string>('EMAIL_FROM_ADDR') || 'no-reply@cobuddy.in'}>`,
        to: email,
        subject: 'Your CoBuddy Admin invitation',
        text: `You have been invited to CoBuddy Admin. Set your password within 7 days: ${url.toString()}`,
      });
      if (result.error) throw new Error('Delivery rejected');
      return 'SENT';
    } catch {
      this.logger.error('Staff invitation delivery failed');
      return 'FAILED';
    }
  }
}

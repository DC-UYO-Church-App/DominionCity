import { Resend } from 'resend';
import { config } from '../config';

const resend = config.resend.apiKey ? new Resend(config.resend.apiKey) : null;

export interface EmailOptions {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  templateId?: string;
  dynamicTemplateData?: Record<string, any>;
}

export class EmailService {
  static async send(options: EmailOptions): Promise<void> {
    try {
      if (!resend) {
        throw new Error('Resend API key is not configured');
      }

      const from = `${config.resend.fromName} <${config.resend.fromEmail}>`;
      const text =
        options.text ??
        ((options.html ? options.html.replace(/<[^>]+>/g, '') : '') || ' ');
      // The Resend SDK resolves with { data, error } rather than rejecting, so
      // an API-level failure has to be surfaced explicitly.
      const { data, error } = await resend.emails.send({
        from,
        to: options.to,
        subject: options.subject,
        text,
        html: options.html,
      });

      if (error) {
        throw new Error(`Resend rejected the message: ${error.name} - ${error.message}`);
      }

      console.log('Email sent successfully to:', options.to, 'id:', data?.id);
    } catch (error) {
      console.error('Error sending email:', error);
      throw error;
    }
  }

  static async sendBulk(messages: EmailOptions[]): Promise<void> {
    try {
      if (!resend) {
        throw new Error('Resend API key is not configured');
      }

      const from = `${config.resend.fromName} <${config.resend.fromEmail}>`;
      const results = await Promise.all(
        messages.map((msg) =>
          resend.emails.send({
            from,
            to: msg.to,
            subject: msg.subject,
            text:
              msg.text ??
              ((msg.html ? msg.html.replace(/<[^>]+>/g, '') : '') || ' '),
            html: msg.html,
          })
        )
      );

      const failures = results.filter((result) => result.error);
      if (failures.length > 0) {
        throw new Error(
          `Resend rejected ${failures.length} of ${messages.length} messages: ` +
            failures.map((f) => f.error?.message).join('; ')
        );
      }

      console.log(`${messages.length} emails sent successfully`);
    } catch (error) {
      console.error('Error sending bulk emails:', error);
      throw error;
    }
  }
}

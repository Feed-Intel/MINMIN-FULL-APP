import { Injectable, Logger } from '@nestjs/common';
import nodemailer from 'nodemailer';

@Injectable()
export class MailerService {
  private readonly logger = new Logger(MailerService.name);
  private readonly transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST ?? 'localhost',
    port: Number(process.env.SMTP_PORT ?? 1025),
    secure: ['true', '1', 'yes'].includes(
      String(process.env.SMTP_SECURE ?? 'false').toLowerCase(),
    ),
    auth:
      process.env.SMTP_USER && process.env.SMTP_PASS
        ? {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          }
        : undefined,
  });

  async sendMail(options: { to: string; subject: string; text: string }): Promise<void> {
    if (!options.to) {
      this.logger.warn('Attempted to send mail without recipient');
      return;
    }

    try {
      await this.transporter.sendMail({
        from: process.env.EMAIL_FROM ?? 'no-reply@minmin.app',
        ...options,
      });
    } catch (error) {
      this.logger.error(`Failed to send mail to ${options.to}`, error as Error);
      throw error;
    }
  }
}

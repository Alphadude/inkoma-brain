import nodemailer from 'nodemailer';
import { BrevoClient } from '@getbrevo/brevo';
import env from '../config/env';
import logger from '../utils/logger';

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
}

/**
 * Sends an email using Brevo HTTPS REST API (preferred, works on Render/cloud with no port blocking)
 * or falls back to Brevo SMTP via Nodemailer.
 */
export const sendEmail = async (options: EmailOptions): Promise<any> => {
  const recipients = (Array.isArray(options.to) ? options.to : [options.to]).map((email) => ({
    email: email.trim(),
  }));

  // 1. Preferred: Brevo HTTPS REST API (Port 443 — never blocked by Render, Heroku, or cloud firewalls)
  if (env.brevo.apiKey) {
    try {
      const client = new BrevoClient({ apiKey: env.brevo.apiKey });
      const result = await client.transactionalEmails.sendTransacEmail({
        sender: {
          name: env.brevo.senderName,
          email: env.brevo.senderEmail,
        },
        to: recipients,
        subject: options.subject,
        htmlContent: options.html,
        textContent: options.text,
      });

      logger.info(`📧 Email sent successfully via Brevo HTTP API to ${options.to}`);
      return result;
    } catch (apiError: any) {
      logger.error('Failed to send email via Brevo HTTP API:', apiError);
      throw apiError;
    }
  }

  // 2. Fallback: SMTP via Nodemailer (Port 587 / 465 / 2525)
  try {
    const transporter = nodemailer.createTransport({
      host: env.brevo.smtpHost,
      port: env.brevo.smtpPort,
      secure: env.brevo.smtpPort === 465,
      auth: {
        user: env.brevo.smtpUser,
        pass: env.brevo.smtpKey,
      },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000,
    });

    const info = await transporter.sendMail({
      from: `"${env.brevo.senderName}" <${env.brevo.senderEmail}>`,
      to: Array.isArray(options.to) ? options.to.join(',') : options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
    });

    logger.info(`📧 Email sent successfully via Brevo SMTP to ${options.to}: ${info.messageId}`);
    return info;
  } catch (smtpError: any) {
    if (
      smtpError.code === 'ETIMEDOUT' ||
      smtpError.message?.toLowerCase().includes('timeout')
    ) {
      logger.error(
        '⚠️ Brevo SMTP Connection Timeout: Cloud providers like Render block outbound SMTP ports (587, 465, 25). To fix this, provide BREVO_API_KEY (xkeysib-...) in your Render environment variables so emails send over HTTPS (port 443).'
      );
    }
    logger.error('Failed to send email via Brevo SMTP:', smtpError);
    throw smtpError;
  }
};

export default {
  sendEmail,
};

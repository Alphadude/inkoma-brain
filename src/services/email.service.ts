import nodemailer from 'nodemailer';
import env from '../config/env';
import logger from '../utils/logger';

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
}

const transporter = nodemailer.createTransport({
  host: env.brevo.smtpHost,
  port: env.brevo.smtpPort,
  secure: false, // 587 uses STARTTLS
  auth: {
    user: env.brevo.smtpUser,
    pass: env.brevo.smtpKey,
  },
});

export const sendEmail = async (options: EmailOptions): Promise<any> => {
  try {
    const info = await transporter.sendMail({
      from: `"${env.brevo.senderName}" <${env.brevo.senderEmail}>`,
      to: Array.isArray(options.to) ? options.to.join(',') : options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
    });

    logger.info(`📧 Email sent successfully to ${options.to}: ${info.messageId}`);
    return info;
  } catch (error) {
    logger.error('Failed to send email via Brevo SMTP:', error);
    throw error;
  }
};

export default {
  sendEmail,
};

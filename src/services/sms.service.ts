import { BrevoClient } from '@getbrevo/brevo';
import env from '../config/env';
import logger from '../utils/logger';
import ApiError from '../utils/ApiError';

export interface SendSmsOptions {
  recipient: string; // E.164 phone format, e.g. +1234567890 or 2348012345678
  content: string;
  sender?: string; // Alphanumeric sender (up to 11 characters)
}

export const sendSms = async (options: SendSmsOptions): Promise<any> => {
  const apiKey = env.brevo.apiKey;

  if (!apiKey) {
    throw new ApiError(
      500,
      'Brevo API Key (BREVO_API_KEY) is missing. Generate a v3 API key in your Brevo Dashboard under SMTP & API > API Keys tab.'
    );
  }

  const client = new BrevoClient({ apiKey });

  try {
    const response = await client.transactionalSms.sendTransacSms({
      sender: (options.sender || env.brevo.smsSender).slice(0, 11),
      recipient: options.recipient,
      content: options.content,
      type: 'transactional',
    });

    logger.info(`📱 SMS sent successfully to ${options.recipient}`);
    return response;
  } catch (error: any) {
    logger.error('Failed to send SMS via Brevo:', error);
    throw new ApiError(error.status || 500, error.message || 'Failed to send SMS via Brevo');
  }
};

export default {
  sendSms,
};

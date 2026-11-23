import crypto from 'crypto';
import jwt, { SignOptions } from 'jsonwebtoken';
import User from '../models/user.model';
import ApiError from '../utils/ApiError';
import logger from '../utils/logger';
import {
  RegisterInput,
  LoginInput,
  AuthResult,
  RegisterResult,
  VerifyEmailInput,
  ResendOtpInput,
  ForgotPasswordInput,
  ResetPasswordInput,
} from '../interfaces/auth.interface';
import { sendEmail } from './email.service';
import { sendSms } from './sms.service';
import {
  getRegistrationOtpEmail,
  getResendOtpEmail,
  getPasswordResetOtpEmail,
} from '../utils/emailTemplates';

const signToken = (id: string): string => {
  const options: SignOptions = {
    expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as any,
  };
  return jwt.sign({ id }, process.env.JWT_SECRET as string, options);
};

/**
 * Registers a new user account and sends an email confirmation OTP via Brevo.
 */
export const register = async (data: RegisterInput): Promise<RegisterResult> => {
  const existing = await User.findOne({ email: data.email.toLowerCase() });
  if (existing) {
    throw new ApiError(409, 'An account with this email already exists');
  }

  // Generate 6-digit verification OTP
  const otp = crypto.randomInt(100000, 999999).toString();
  const hashedOtp = crypto.createHash('sha256').update(otp).digest('hex');

  const user = await User.create({
    ...data,
    email: data.email.toLowerCase(),
    isEmailVerified: false,
    emailVerificationOtp: hashedOtp,
    emailVerificationOtpExpires: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes expiry
  });

  // Dispatch confirmation email via Brevo
  try {
    const { html, text } = getRegistrationOtpEmail(otp, user.name);
    await sendEmail({
      to: user.email,
      subject: 'Confirm Your Email Address — Inkoma',
      html,
      text,
    });
  } catch (error) {
    logger.error('Failed to send email verification OTP via Brevo:', error);
  }

  return {
    user,
    message: 'Account registered successfully. An OTP has been sent to your email to confirm your account.',
  };
};

/**
 * Confirms user email using the 6-digit OTP and returns a signed JWT token.
 */
export const verifyEmail = async (data: VerifyEmailInput): Promise<AuthResult> => {
  const hashedOtp = crypto.createHash('sha256').update(data.otp).digest('hex');

  const user = await User.findOne({
    email: data.email.toLowerCase(),
    emailVerificationOtp: hashedOtp,
    emailVerificationOtpExpires: { $gt: new Date() },
  });

  if (!user) {
    throw new ApiError(400, 'Invalid or expired confirmation OTP');
  }

  user.isEmailVerified = true;
  user.emailVerificationOtp = undefined;
  user.emailVerificationOtpExpires = undefined;
  await user.save();

  const token = signToken(user._id.toString());

  return { user, token };
};

/**
 * Resends a new confirmation OTP via Brevo.
 */
export const resendVerificationOtp = async (data: ResendOtpInput): Promise<{ message: string }> => {
  const user = await User.findOne({ email: data.email.toLowerCase() });

  if (!user) {
    throw new ApiError(404, 'No account found with this email');
  }

  if (user.isEmailVerified) {
    throw new ApiError(400, 'This account is already verified');
  }

  // Generate fresh 6-digit OTP
  const otp = crypto.randomInt(100000, 999999).toString();
  const hashedOtp = crypto.createHash('sha256').update(otp).digest('hex');

  user.emailVerificationOtp = hashedOtp;
  user.emailVerificationOtpExpires = new Date(Date.now() + 10 * 60 * 1000);
  await user.save({ validateBeforeSave: false });

  const { html, text } = getResendOtpEmail(otp, user.name);
  await sendEmail({
    to: user.email,
    subject: 'Your New Email Confirmation Code — Inkoma',
    html,
    text,
  });

  return {
    message: 'A new verification OTP has been sent to your email.',
  };
};

/**
 * Authenticates a user and returns a JWT.
 */
export const login = async (data: LoginInput): Promise<AuthResult> => {
  const user = await User.findOne({ email: data.email.toLowerCase() }).select('+password');

  if (!user || !(await user.comparePassword(data.password))) {
    throw new ApiError(401, 'Invalid email or password');
  }

  if (!user.isEmailVerified) {
    throw new ApiError(
      403,
      'Email address is not verified. Please verify your email using the OTP sent to your inbox.'
    );
  }

  const token = signToken(user._id.toString());

  return { user, token };
};

/**
 * Initiates forgot password flow by generating an OTP and delivering it via Brevo.
 */
export const forgotPassword = async (
  data: ForgotPasswordInput
): Promise<{ message: string; channel: 'email' | 'sms' | 'both' }> => {
  if (!data.email && !data.phone) {
    throw new ApiError(400, 'Please provide an email or phone number');
  }

  const query: Record<string, any> = {};
  if (data.email) query['email'] = data.email.toLowerCase();
  if (data.phone) query['phone'] = data.phone;

  const user = await User.findOne(query);
  if (!user) {
    throw new ApiError(404, 'No account found with this email or phone number');
  }

  // Generate a cryptographically secure 6-digit numeric OTP
  const otp = crypto.randomInt(100000, 999999).toString();
  const hashedOtp = crypto.createHash('sha256').update(otp).digest('hex');

  user.resetPasswordOtp = hashedOtp;
  user.resetPasswordOtpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry
  await user.save({ validateBeforeSave: false });

  let sentViaSms = false;
  let sentViaEmail = false;

  // 1. Send via SMS if phone was provided or user has a registered phone
  const recipientPhone = data.phone || user.phone;
  if (recipientPhone && process.env.BREVO_API_KEY) {
    try {
      await sendSms({
        recipient: recipientPhone,
        content: `Your Inkoma password reset code is ${otp}. It will expire in 10 minutes.`,
      });
      sentViaSms = true;
    } catch (smsError: any) {
      logger.warn(`Could not deliver OTP via Brevo SMS to ${recipientPhone}: ${smsError.message}`);
    }
  }

  // 2. Send via Brevo Email (SMTP)
  if (user.email) {
    try {
      const { html, text } = getPasswordResetOtpEmail(otp, user.name);
      await sendEmail({
        to: user.email,
        subject: 'Password Reset Code — Inkoma',
        html,
        text,
      });
      sentViaEmail = true;
    } catch (emailError: any) {
      logger.error('Failed to send OTP email via Brevo:', emailError);
      if (!sentViaSms) {
        throw new ApiError(500, 'Failed to send OTP via Brevo. Please try again later.');
      }
    }
  }

  const channel: 'email' | 'sms' | 'both' =
    sentViaSms && sentViaEmail ? 'both' : sentViaSms ? 'sms' : 'email';

  return {
    message: `OTP has been sent successfully via ${channel}.`,
    channel,
  };
};

/**
 * Resets user password after verifying the OTP.
 */
export const resetPassword = async (
  data: ResetPasswordInput
): Promise<{ message: string }> => {
  if (!data.email && !data.phone) {
    throw new ApiError(400, 'Please provide an email or phone number');
  }

  const hashedOtp = crypto.createHash('sha256').update(data.otp).digest('hex');

  const query: Record<string, any> = {
    resetPasswordOtp: hashedOtp,
    resetPasswordOtpExpires: { $gt: new Date() },
  };

  if (data.email) query['email'] = data.email.toLowerCase();
  if (data.phone) query['phone'] = data.phone;

  const user = await User.findOne(query).select('+password');
  if (!user) {
    throw new ApiError(400, 'Invalid or expired OTP');
  }

  user.password = data.newPassword;
  user.resetPasswordOtp = undefined;
  user.resetPasswordOtpExpires = undefined;
  await user.save();

  return {
    message: 'Password has been reset successfully. You can now log in with your new password.',
  };
};

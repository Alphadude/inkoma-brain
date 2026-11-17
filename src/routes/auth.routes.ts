import { Router } from 'express';
import * as authController from '../controllers/auth.controller';
import validate from '../middlewares/validate.middleware';
import { authLimiter } from '../middlewares/rateLimiter';
import {
  registerSchema,
  verifyEmailSchema,
  resendVerificationOtpSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from './schemas/auth.schema';

const router = Router();

router.use(authLimiter);

/**
 * @route   POST /api/v1/auth/register
 * @desc    Register a new user and send verification OTP via Brevo
 * @access  Public
 */
router.post('/register', validate(registerSchema), authController.register);

/**
 * @route   POST /api/v1/auth/verify-email
 * @desc    Confirm email with OTP and get auth JWT
 * @access  Public
 */
router.post('/verify-email', validate(verifyEmailSchema), authController.verifyEmail);

/**
 * @route   POST /api/v1/auth/resend-verification-otp
 * @desc    Resend confirmation OTP via Brevo
 * @access  Public
 */
router.post(
  '/resend-verification-otp',
  validate(resendVerificationOtpSchema),
  authController.resendVerificationOtp
);

/**
 * @route   POST /api/v1/auth/login
 * @desc    Login and receive a JWT
 * @access  Public
 */
router.post('/login', validate(loginSchema), authController.login);

/**
 * @route   POST /api/v1/auth/forgot-password
 * @desc    Generate OTP and send via Brevo (Email/SMS)
 * @access  Public
 */
router.post('/forgot-password', validate(forgotPasswordSchema), authController.forgotPassword);

/**
 * @route   POST /api/v1/auth/reset-password
 * @desc    Verify OTP and reset password
 * @access  Public
 */
router.post('/reset-password', validate(resetPasswordSchema), authController.resetPassword);

export default router;

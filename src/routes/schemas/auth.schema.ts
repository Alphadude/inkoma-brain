import Joi from 'joi';

export const registerSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().lowercase().required(),
  phone: Joi.string().trim().optional(),
  password: Joi.string()
    .min(8)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .required()
    .messages({
      'string.pattern.base':
        'Password must contain at least one uppercase letter, one lowercase letter, and one number',
    }),
});

export const loginSchema = Joi.object({
  email: Joi.string().email().lowercase().required(),
  password: Joi.string().required(),
});

export const verifyEmailSchema = Joi.object({
  email: Joi.string().email().lowercase().required(),
  otp: Joi.string().length(6).required(),
});

export const resendVerificationOtpSchema = Joi.object({
  email: Joi.string().email().lowercase().required(),
});

export const forgotPasswordSchema = Joi.object({
  email: Joi.string().email().lowercase().optional(),
  phone: Joi.string().trim().optional(),
}).or('email', 'phone');

export const resetPasswordSchema = Joi.object({
  email: Joi.string().email().lowercase().optional(),
  phone: Joi.string().trim().optional(),
  otp: Joi.string().length(6).required(),
  newPassword: Joi.string()
    .min(8)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .required()
    .messages({
      'string.pattern.base':
        'Password must contain at least one uppercase letter, one lowercase letter, and one number',
    }),
}).or('email', 'phone');

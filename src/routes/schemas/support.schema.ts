import Joi from 'joi';

export const initializeDonationSchema = Joi.object({
  amount: Joi.number().min(1).required(),
  email: Joi.string().email({ tlds: { allow: false } }).required(),
  name: Joi.string().trim().max(100).optional(),
  currency: Joi.string().valid('NGN', 'USD', 'EUR', 'GBP').default('NGN'),
  targetType: Joi.string().valid('platform', 'author').default('platform'),
  authorId: Joi.string().trim().hex().length(24).optional(),
  paymentMethod: Joi.string().valid('paystack', 'bank_transfer', 'crypto').default('paystack'),
});

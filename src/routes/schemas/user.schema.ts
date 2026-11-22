import Joi from 'joi';

export const updateProfileSchema = Joi.object({
  name: Joi.string().min(2).max(100).optional(),
  username: Joi.string()
    .min(3)
    .max(30)
    .pattern(/^[a-zA-Z0-9_-]+$/)
    .lowercase()
    .optional()
    .messages({
      'string.pattern.base':
        'Username can only contain alphanumeric characters, underscores, and hyphens',
    }),
  penName: Joi.string().trim().max(100).allow('').optional(),
  bio: Joi.string().trim().max(500).allow('').optional(),
  phone: Joi.string().trim().allow('').optional(),
  avatarUrl: Joi.string().uri().allow('').optional(),
}).min(1);

export const updateBankingSchema = Joi.object({
  bankName: Joi.string().trim().min(2).max(100).required(),
  accountNumber: Joi.string()
    .trim()
    .pattern(/^[0-9]{10}$/)
    .required()
    .messages({
      'string.pattern.base': 'Account number must be exactly 10 digits',
    }),
  accountHolderName: Joi.string().trim().min(2).max(100).required(),
});

export const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required(),
  newPassword: Joi.string()
    .min(8)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .required()
    .messages({
      'string.pattern.base':
        'New password must contain at least one uppercase letter, one lowercase letter, and one number',
    }),
});

export const updatePrivacySchema = Joi.object({
  publicProfile: Joi.boolean().optional(),
  publicReadingHistory: Joi.boolean().optional(),
  allowFollowers: Joi.boolean().optional(),
  showReadingActivity: Joi.boolean().optional(),
}).min(1);

export const updateNotificationsSchema = Joi.object({
  emailNewChapters: Joi.boolean().optional(),
  emailComments: Joi.boolean().optional(),
  emailPatronSupport: Joi.boolean().optional(),
  weeklyFolkloreDigest: Joi.boolean().optional(),
  newChapterAlerts: Joi.boolean().optional(),
  commentReplies: Joi.boolean().optional(),
  patronTips: Joi.boolean().optional(),
  communityAnnouncements: Joi.boolean().optional(),
}).min(1);

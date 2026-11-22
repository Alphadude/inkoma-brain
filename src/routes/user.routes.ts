import { Router } from 'express';
import * as userController from '../controllers/user.controller';
import { protect } from '../middlewares/auth.middleware';
import validate from '../middlewares/validate.middleware';
import upload from '../middlewares/upload.middleware';
import {
  updateProfileSchema,
  updateBankingSchema,
  changePasswordSchema,
  updatePrivacySchema,
  updateNotificationsSchema,
} from './schemas/user.schema';

const router = Router();

// All settings routes require authentication
router.use(protect);

/**
 * @route   GET  /api/v1/users/me              — Get current user profile and settings
 */
router.get('/me', userController.getMe);

/**
 * @route   PUT  /api/v1/users/me/profile      — Update user profile details
 */
router.put('/me/profile', validate(updateProfileSchema), userController.updateProfile);

/**
 * @route   POST /api/v1/users/me/avatar       — Upload profile avatar image
 */
router.post('/me/avatar', upload.single('avatar'), userController.uploadAvatar);

/**
 * @route   PUT  /api/v1/users/me/banking      — Update payout banking details
 */
router.put('/me/banking', validate(updateBankingSchema), userController.updateBanking);

/**
 * @route   PUT  /api/v1/users/me/password     — Change password
 */
router.put('/me/password', validate(changePasswordSchema), userController.changePassword);

/**
 * @route   PUT  /api/v1/users/me/privacy      — Update privacy preferences
 */
router.put('/me/privacy', validate(updatePrivacySchema), userController.updatePrivacy);

/**
 * @route   PUT  /api/v1/users/me/notifications— Update notification preferences
 */
router.put(
  '/me/notifications',
  validate(updateNotificationsSchema),
  userController.updateNotifications
);

export default router;

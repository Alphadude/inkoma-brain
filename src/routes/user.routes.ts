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
  updateProgressSchema,
  createQuoteSchema,
} from './schemas/user.schema';

const router = Router();

/**
 * @route   GET  /api/v1/users/top-authors             — Get top authors of the week (Public)
 * @route   GET  /api/v1/users/profile/:username       — Get public storyteller profile (Public)
 * @route   GET  /api/v1/users/profile/:username/followers — Get user followers (Public)
 * @route   GET  /api/v1/users/profile/:username/following — Get users followed (Public)
 * @route   GET  /api/v1/users/support/:userIdOrUsername — Get author support / tipping details (Public)
 */
router.get('/top-authors', userController.getTopAuthors);
router.get('/profile/:username', userController.getPublicProfile);
router.get('/profile/:username/followers', userController.getFollowers);
router.get('/profile/:username/following', userController.getFollowing);
router.get('/:username/followers', userController.getFollowers);
router.get('/:username/following', userController.getFollowing);
router.get('/support/:userIdOrUsername', userController.getAuthorSupport);

// The following routes require authentication
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

/**
 * @route   GET    /api/v1/users/bookmarks            — Get bookmarked stories (Protected)
 * @route   POST   /api/v1/users/bookmarks/:storyId   — Bookmark a story (Protected)
 * @route   DELETE /api/v1/users/bookmarks/:storyId   — Remove a bookmark (Protected)
 */
router.get('/bookmarks', userController.getBookmarks);
router.post('/bookmarks/:storyId', userController.addBookmark);
router.delete('/bookmarks/:storyId', userController.removeBookmark);

/**
 * @route   GET    /api/v1/users/favorites            — Get favorited stories (Protected)
 * @route   POST   /api/v1/users/favorites/:storyId   — Add story to favorites (Protected)
 * @route   DELETE /api/v1/users/favorites/:storyId   — Remove story from favorites (Protected)
 */
router.get('/favorites', userController.getFavorites);
router.post('/favorites/:storyId', userController.addFavorite);
router.delete('/favorites/:storyId', userController.removeFavorite);

/**
 * @route   GET    /api/v1/users/library              — Aggregate personal library overview (Protected)
 * @route   DELETE /api/v1/users/library              — Clear all library data (Protected)
 */
router.route('/library').get(userController.getLibrary).delete(userController.clearLibrary);

/**
 * @route   GET    /api/v1/users/library/progress            — Get reading progress list (Protected)
 * @route   PUT    /api/v1/users/library/progress/:storyId   — Upsert reading progress (Protected)
 * @route   DELETE /api/v1/users/library/progress/:storyId   — Remove from reading progress (Protected)
 */
router.get('/library/progress', userController.getReadingProgress);
router.put(
  '/library/progress/:storyId',
  validate(updateProgressSchema),
  userController.upsertReadingProgress
);
router.delete('/library/progress/:storyId', userController.removeReadingProgress);

/**
 * @route   GET    /api/v1/users/quotes               — Get saved quotes (Protected)
 * @route   POST   /api/v1/users/quotes               — Save a quote (Protected)
 * @route   DELETE /api/v1/users/quotes/:quoteId      — Delete a saved quote (Protected)
 */
router.get('/quotes', userController.getQuotes);
router.post('/quotes', validate(createQuoteSchema), userController.addQuote);
router.delete('/quotes/:quoteId', userController.removeQuote);

/**
 * @route   POST   /api/v1/users/follow/:userId        — Follow a storyteller (Protected)
 * @route   DELETE /api/v1/users/follow/:userId        — Unfollow a storyteller (Protected)
 * @route   GET    /api/v1/users/follow/status/:userId — Check follow status (Protected)
 */
router.post('/follow/:userId', userController.followUser);
router.delete('/follow/:userId', userController.unfollowUser);
router.get('/follow/status/:userId', userController.getFollowStatus);

export default router;

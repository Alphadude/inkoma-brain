import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import * as userService from '../services/user.service';
import asyncHandler from '../utils/asyncHandler';
import ApiResponse from '../utils/ApiResponse';
import ApiError from '../utils/ApiError';
import { uploadBufferToCloudinary } from '../config/cloudinary';

/**
 * GET /api/v1/users/me
 * Fetch current user settings & profile.
 */
export const getMe = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const user = await userService.getMe(req.user!._id.toString());
  res.status(200).json(new ApiResponse(200, { user }, 'User profile fetched successfully'));
});

/**
 * PUT /api/v1/users/me/profile
 * Update profile details (name, username, penName, bio, phone, avatarUrl).
 */
export const updateProfile = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const user = await userService.updateProfile(req.user!._id.toString(), req.body);
  res.status(200).json(new ApiResponse(200, { user }, 'Profile updated successfully'));
});

/**
 * POST /api/v1/users/me/avatar
 * Upload user avatar image to Cloudinary and update user record.
 */
export const uploadAvatar = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.file) {
    throw new ApiError(400, 'No avatar image file uploaded');
  }

  const uploadRes = await uploadBufferToCloudinary(req.file.buffer, 'inkoma_avatars');
  const user = await userService.updateProfile(req.user!._id.toString(), {
    avatarUrl: uploadRes.secure_url,
  });

  res.status(200).json(
    new ApiResponse(
      200,
      {
        url: uploadRes.secure_url,
        publicId: uploadRes.public_id,
        user,
      },
      'Avatar uploaded successfully'
    )
  );
});

/**
 * PUT /api/v1/users/me/banking
 * Update payout banking details.
 */
export const updateBanking = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const user = await userService.updateBanking(req.user!._id.toString(), req.body);
  res.status(200).json(new ApiResponse(200, { user }, 'Banking details updated successfully'));
});

/**
 * PUT /api/v1/users/me/password
 * Change password.
 */
export const changePassword = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  await userService.changePassword(req.user!._id.toString(), req.body);
  res.status(200).json(new ApiResponse(200, null, 'Password changed successfully'));
});

/**
 * PUT /api/v1/users/me/privacy
 * Update privacy preferences.
 */
export const updatePrivacy = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const user = await userService.updatePrivacy(req.user!._id.toString(), req.body);
  res.status(200).json(new ApiResponse(200, { user }, 'Privacy settings updated successfully'));
});

/**
 * PUT /api/v1/users/me/notifications
 * Update notification preferences.
 */
export const updateNotifications = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const user = await userService.updateNotifications(req.user!._id.toString(), req.body);
  res.status(200).json(
    new ApiResponse(200, { user }, 'Notification preferences updated successfully')
  );
});

/**
 * GET /api/v1/users/top-authors
 * Get top authors of the week (Public).
 */
export const getTopAuthors = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
  const authors = await userService.getTopAuthors(10);
  res.status(200).json(new ApiResponse(200, { authors }, 'Top authors fetched successfully'));
});

/**
 * GET /api/v1/users/bookmarks
 * Get current user bookmarked stories (Protected).
 */
export const getBookmarks = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const bookmarks = await userService.getBookmarks(req.user!._id.toString());
  res.status(200).json(new ApiResponse(200, { bookmarks }, 'Bookmarks fetched successfully'));
});

/**
 * POST /api/v1/users/bookmarks/:storyId
 * Add a story to bookmarks (Protected).
 */
export const addBookmark = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  await userService.addBookmark(req.user!._id.toString(), req.params['storyId']!);
  res.status(200).json(new ApiResponse(200, null, 'Story bookmarked successfully'));
});

/**
 * DELETE /api/v1/users/bookmarks/:storyId
 * Remove a story from bookmarks (Protected).
 */
export const removeBookmark = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  await userService.removeBookmark(req.user!._id.toString(), req.params['storyId']!);
  res.status(200).json(new ApiResponse(200, null, 'Story unbookmarked successfully'));
});

/**
 * GET /api/v1/users/library
 * Aggregate personal library overview (Recently read, bookmarks, favorites, quotes, counts).
 */
export const getLibrary = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const library = await userService.getLibraryOverview(req.user!._id.toString());
  res.status(200).json(new ApiResponse(200, library, 'Library overview fetched successfully'));
});

/**
 * DELETE /api/v1/users/library
 * Clear all personal library data.
 */
export const clearLibrary = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  await userService.clearLibrary(req.user!._id.toString());
  res.status(200).json(new ApiResponse(200, null, 'Library cleared successfully'));
});

/**
 * GET /api/v1/users/library/progress
 * Get user reading progress / recently read list.
 */
export const getReadingProgress = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const progress = await userService.getReadingProgress(req.user!._id.toString());
  res.status(200).json(new ApiResponse(200, { progress }, 'Reading progress fetched successfully'));
});

/**
 * PUT /api/v1/users/library/progress/:storyId
 * Upsert reading progress for a story.
 */
export const upsertReadingProgress = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const progress = await userService.upsertReadingProgress(
    req.user!._id.toString(),
    req.params['storyId']!,
    req.body
  );
  res.status(200).json(new ApiResponse(200, { progress }, 'Reading progress updated successfully'));
});

/**
 * DELETE /api/v1/users/library/progress/:storyId
 * Remove a story from reading history.
 */
export const removeReadingProgress = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  await userService.removeReadingProgress(req.user!._id.toString(), req.params['storyId']!);
  res.status(200).json(new ApiResponse(200, null, 'Story removed from reading progress'));
});

/**
 * GET /api/v1/users/favorites
 * Get all favorited stories.
 */
export const getFavorites = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const favorites = await userService.getFavorites(req.user!._id.toString());
  res.status(200).json(new ApiResponse(200, { favorites }, 'Favorites fetched successfully'));
});

/**
 * POST /api/v1/users/favorites/:storyId
 * Add story to favorites.
 */
export const addFavorite = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  await userService.addFavorite(req.user!._id.toString(), req.params['storyId']!);
  res.status(200).json(new ApiResponse(200, null, 'Story added to favorites'));
});

/**
 * DELETE /api/v1/users/favorites/:storyId
 * Remove story from favorites.
 */
export const removeFavorite = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  await userService.removeFavorite(req.user!._id.toString(), req.params['storyId']!);
  res.status(200).json(new ApiResponse(200, null, 'Story removed from favorites'));
});

/**
 * GET /api/v1/users/quotes
 * Get all saved quotes.
 */
export const getQuotes = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const quotes = await userService.getQuotes(req.user!._id.toString());
  res.status(200).json(new ApiResponse(200, { quotes }, 'Saved quotes fetched successfully'));
});

/**
 * POST /api/v1/users/quotes
 * Save a new quote.
 */
export const addQuote = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const quote = await userService.addQuote(req.user!._id.toString(), req.body);
  res.status(201).json(new ApiResponse(201, { quote }, 'Quote saved successfully'));
});

/**
 * DELETE /api/v1/users/quotes/:quoteId
 * Delete a saved quote.
 */
export const removeQuote = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  await userService.removeQuote(req.user!._id.toString(), req.params['quoteId']!);
  res.status(200).json(new ApiResponse(200, null, 'Saved quote removed successfully'));
});

/**
 * GET /api/v1/users/profile/:username
 * Public storyteller profile lookup.
 */
export const getPublicProfile = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  let currentUserId: string | undefined;
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const token = authHeader.split(' ')[1];
      const decoded: any = jwt.verify(token, process.env.JWT_SECRET as string);
      currentUserId = decoded?.id;
    } catch {
      // Soft ignore invalid/expired tokens for public profile
    }
  }

  const profile = await userService.getPublicProfile(req.params['username']!, currentUserId);
  res.status(200).json(new ApiResponse(200, { user: profile }, 'Profile fetched successfully'));
});

/**
 * POST /api/v1/users/follow/:userId
 * Follow a storyteller.
 */
export const followUser = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  await userService.followUser(req.user!._id.toString(), req.params['userId']!);
  res.status(200).json(new ApiResponse(200, null, 'Storyteller followed successfully'));
});

/**
 * DELETE /api/v1/users/follow/:userId
 * Unfollow a storyteller.
 */
export const unfollowUser = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  await userService.unfollowUser(req.user!._id.toString(), req.params['userId']!);
  res.status(200).json(new ApiResponse(200, null, 'Storyteller unfollowed successfully'));
});

/**
 * GET /api/v1/users/follow/status/:userId
 * Check follow status between current user and target user.
 */
export const getFollowStatus = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const status = await userService.getFollowStatus(req.user!._id.toString(), req.params['userId']!);
  res.status(200).json(new ApiResponse(200, status, 'Follow status checked'));
});

/**
 * GET /api/v1/users/support/:userIdOrUsername
 * Public author support / tipping details.
 */
export const getAuthorSupport = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const support = await userService.getAuthorSupport(req.params['userIdOrUsername']!);
  res.status(200).json(new ApiResponse(200, support, 'Support details fetched successfully'));
});

/**
 * GET /api/v1/users/profile/:username/followers
 * Public followers list for a storyteller.
 */
export const getFollowers = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  let currentUserId: string | undefined;
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const token = authHeader.split(' ')[1];
      const decoded: any = jwt.verify(token, process.env.JWT_SECRET as string);
      currentUserId = decoded?.id;
    } catch {
      // Soft ignore invalid/expired tokens for public endpoint
    }
  }

  const { page, limit, search } = req.query;
  const result = await userService.getFollowers(req.params['username']!, currentUserId, {
    page: page ? Number(page) : undefined,
    limit: limit ? Number(limit) : undefined,
    search: search ? String(search) : undefined,
  });

  res.status(200).json(new ApiResponse(200, result, 'Followers fetched successfully'));
});

/**
 * GET /api/v1/users/profile/:username/following
 * Public following list for a storyteller.
 */
export const getFollowing = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  let currentUserId: string | undefined;
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const token = authHeader.split(' ')[1];
      const decoded: any = jwt.verify(token, process.env.JWT_SECRET as string);
      currentUserId = decoded?.id;
    } catch {
      // Soft ignore invalid/expired tokens for public endpoint
    }
  }

  const { page, limit, search } = req.query;
  const result = await userService.getFollowing(req.params['username']!, currentUserId, {
    page: page ? Number(page) : undefined,
    limit: limit ? Number(limit) : undefined,
    search: search ? String(search) : undefined,
  });

  res.status(200).json(new ApiResponse(200, result, 'Following fetched successfully'));
});

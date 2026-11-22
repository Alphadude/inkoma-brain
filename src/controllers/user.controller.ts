import { Request, Response } from 'express';
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

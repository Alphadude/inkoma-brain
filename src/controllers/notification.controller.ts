import { Request, Response } from 'express';
import asyncHandler from '../utils/asyncHandler';
import ApiResponse from '../utils/ApiResponse';
import * as notificationService from '../services/notification.service';

/**
 * GET /api/v1/notifications
 * Get user notifications with unread count.
 */
export const getNotifications = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { page, limit, unreadOnly } = req.query;
  const result = await notificationService.getNotifications(req.user!._id.toString(), {
    page: page ? Number(page) : undefined,
    limit: limit ? Number(limit) : undefined,
    unreadOnly: unreadOnly === 'true',
  });

  res.status(200).json(new ApiResponse(200, result, 'Notifications fetched successfully'));
});

/**
 * PATCH /api/v1/notifications/:id/read
 * Mark single notification as read.
 */
export const markAsRead = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  await notificationService.markAsRead(req.user!._id.toString(), req.params['id']!);
  res.status(200).json(new ApiResponse(200, null, 'Notification marked as read'));
});

/**
 * PATCH /api/v1/notifications/read-all
 * Mark all user notifications as read.
 */
export const markAllAsRead = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const result = await notificationService.markAllAsRead(req.user!._id.toString());
  res.status(200).json(new ApiResponse(200, result, 'All notifications marked as read'));
});

/**
 * DELETE /api/v1/notifications/:id
 * Delete a single notification.
 */
export const deleteNotification = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  await notificationService.deleteNotification(req.user!._id.toString(), req.params['id']!);
  res.status(200).json(new ApiResponse(200, null, 'Notification deleted successfully'));
});

/**
 * DELETE /api/v1/notifications
 * Clear all notifications for user.
 */
export const clearAllNotifications = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  await notificationService.clearAllNotifications(req.user!._id.toString());
  res.status(200).json(new ApiResponse(200, null, 'All notifications cleared'));
});

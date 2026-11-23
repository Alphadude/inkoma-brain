import { Router } from 'express';
import * as notificationController from '../controllers/notification.controller';
import { protect } from '../middlewares/auth.middleware';

const router = Router();

// All notification routes are protected
router.use(protect);

/**
 * @route   GET    /api/v1/notifications         — List notifications with unread count
 * @route   DELETE /api/v1/notifications         — Clear all notifications
 * @route   PATCH  /api/v1/notifications/read-all— Mark all as read
 * @route   PATCH  /api/v1/notifications/:id/read— Mark single notification as read
 * @route   DELETE /api/v1/notifications/:id     — Delete a notification
 */
router
  .route('/')
  .get(notificationController.getNotifications)
  .delete(notificationController.clearAllNotifications);

router.patch('/read-all', notificationController.markAllAsRead);
router.patch('/:id/read', notificationController.markAsRead);
router.delete('/:id', notificationController.deleteNotification);

export default router;

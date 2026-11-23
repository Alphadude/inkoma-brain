import { Types } from 'mongoose';
import Notification from '../models/notification.model';
import ApiError from '../utils/ApiError';
import { CreateNotificationInput, INotification } from '../interfaces/notification.interface';

/**
 * Creates and persists a notification.
 */
export const createNotification = async (
  input: CreateNotificationInput
): Promise<INotification> => {
  // Don't notify self
  if (input.actor && input.actor.toString() === input.recipient.toString()) {
    return null as any;
  }

  const notification = await Notification.create({
    recipient: new Types.ObjectId(input.recipient),
    actor: input.actor ? new Types.ObjectId(input.actor) : undefined,
    actorName: input.actorName,
    actorAvatar: input.actorAvatar,
    type: input.type,
    title: input.title,
    message: input.message,
    link: input.link,
    metadata: input.metadata,
    isRead: false,
  });

  return notification;
};

/**
 * Retrieves paginated notifications and unread count for user.
 */
export const getNotifications = async (
  userId: string,
  options: { page?: number; limit?: number; unreadOnly?: boolean } = {}
): Promise<{
  notifications: any[];
  total: number;
  unreadCount: number;
  page: number;
  limit: number;
  totalPages: number;
}> => {
  const page = Math.max(1, Number(options.page) || 1);
  const limit = Math.max(1, Math.min(100, Number(options.limit) || 20));
  const skip = (page - 1) * limit;

  const userObjectId = new Types.ObjectId(userId);
  const filter: any = { recipient: userObjectId };
  if (options.unreadOnly) {
    filter.isRead = false;
  }

  const [total, unreadCount, notifications] = await Promise.all([
    Notification.countDocuments(filter),
    Notification.countDocuments({ recipient: userObjectId, isRead: false }),
    Notification.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
  ]);

  const formatted = notifications.map((n) => ({
    id: n._id.toString(),
    type: n.type,
    title: n.title,
    message: n.message,
    link: n.link,
    actorName: n.actorName,
    actorAvatar: n.actorAvatar,
    metadata: n.metadata,
    isRead: n.isRead,
    createdAt: n.createdAt,
  }));

  return {
    notifications: formatted,
    total,
    unreadCount,
    page,
    limit,
    totalPages: Math.ceil(total / limit) || 1,
  };
};

/**
 * Marks a single notification as read.
 */
export const markAsRead = async (
  userId: string,
  notificationId: string
): Promise<void> => {
  const result = await Notification.findOneAndUpdate(
    { _id: notificationId, recipient: userId },
    { $set: { isRead: true } }
  );

  if (!result) {
    throw new ApiError(404, 'Notification not found');
  }
};

/**
 * Marks all notifications for a user as read.
 */
export const markAllAsRead = async (userId: string): Promise<{ updatedCount: number }> => {
  const result = await Notification.updateMany(
    { recipient: userId, isRead: false },
    { $set: { isRead: true } }
  );

  return { updatedCount: result.modifiedCount };
};

/**
 * Deletes a single notification.
 */
export const deleteNotification = async (
  userId: string,
  notificationId: string
): Promise<void> => {
  const result = await Notification.findOneAndDelete({
    _id: notificationId,
    recipient: userId,
  });

  if (!result) {
    throw new ApiError(404, 'Notification not found');
  }
};

/**
 * Deletes all notifications for a user.
 */
export const clearAllNotifications = async (userId: string): Promise<void> => {
  await Notification.deleteMany({ recipient: userId });
};

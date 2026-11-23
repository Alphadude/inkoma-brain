import { Document, Types } from 'mongoose';

export type NotificationType =
  | 'tip'
  | 'comment'
  | 'chapter_release'
  | 'like'
  | 'follow'
  | 'system';

export interface INotification extends Document {
  recipient: Types.ObjectId;
  actor?: Types.ObjectId;
  actorName?: string;
  actorAvatar?: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  metadata?: Record<string, any>;
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateNotificationInput {
  recipient: string | Types.ObjectId;
  actor?: string | Types.ObjectId;
  actorName?: string;
  actorAvatar?: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  metadata?: Record<string, any>;
}

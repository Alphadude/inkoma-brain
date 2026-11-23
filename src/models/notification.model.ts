import mongoose, { Schema } from 'mongoose';
import { INotification } from '../interfaces/notification.interface';

const notificationSchema = new Schema<INotification>(
  {
    recipient: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    actor: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    actorName: {
      type: String,
      trim: true,
    },
    actorAvatar: {
      type: String,
      trim: true,
    },
    type: {
      type: String,
      enum: ['tip', 'comment', 'chapter_release', 'like', 'follow', 'system'],
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    link: {
      type: String,
      trim: true,
    },
    metadata: {
      type: Schema.Types.Mixed,
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  { timestamps: true }
);

notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });

const Notification = mongoose.model<INotification>('Notification', notificationSchema);
export default Notification;

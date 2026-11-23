import mongoose, { Schema } from 'mongoose';
import { IDiscussion, IDiscussionReply } from '../interfaces/discussion.interface';

const replySchema = new Schema<IDiscussionReply>(
  {
    author: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    authorName: {
      type: String,
      required: true,
      trim: true,
    },
    authorPenName: {
      type: String,
      trim: true,
    },
    authorAvatar: {
      type: String,
      trim: true,
    },
    content: {
      type: String,
      required: [true, 'Reply content is required'],
      trim: true,
      maxlength: [2000, 'Reply cannot exceed 2000 characters'],
    },
    likes: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

const discussionSchema = new Schema<IDiscussion>(
  {
    author: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    authorName: {
      type: String,
      required: true,
      trim: true,
    },
    authorPenName: {
      type: String,
      trim: true,
    },
    authorAvatar: {
      type: String,
      trim: true,
    },
    title: {
      type: String,
      required: [true, 'Discussion title is required'],
      trim: true,
      minlength: [5, 'Title must be at least 5 characters'],
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    content: {
      type: String,
      required: [true, 'Discussion content is required'],
      trim: true,
      maxlength: [5000, 'Discussion cannot exceed 5000 characters'],
    },
    tradition: {
      type: String,
      trim: true,
      default: 'General Lore',
      index: true,
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    likes: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    likesCount: {
      type: Number,
      default: 0,
      index: true,
    },
    replies: [replySchema],
    repliesCount: {
      type: Number,
      default: 0,
    },
    isPinned: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

discussionSchema.index({ createdAt: -1 });

const Discussion = mongoose.model<IDiscussion>('Discussion', discussionSchema);
export default Discussion;

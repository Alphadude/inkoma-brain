import mongoose, { Schema } from 'mongoose';
import { IComment } from '../interfaces/comment.interface';

const commentSchema = new Schema<IComment>(
  {
    story: {
      type: Schema.Types.ObjectId,
      ref: 'Story',
      required: true,
      index: true,
    },
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
    chapterNumber: {
      type: Number,
      index: true,
    },
    nodeId: {
      type: String,
      trim: true,
    },
    parentComment: {
      type: Schema.Types.ObjectId,
      ref: 'Comment',
      index: true,
    },
    content: {
      type: String,
      required: [true, 'Comment content is required'],
      trim: true,
      maxlength: [1000, 'Comment cannot exceed 1000 characters'],
    },
    likes: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    likesCount: {
      type: Number,
      default: 0,
    },
    repliesCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

commentSchema.index({ story: 1, chapterNumber: 1, createdAt: -1 });

const Comment = mongoose.model<IComment>('Comment', commentSchema);
export default Comment;

import { Document, Types } from 'mongoose';

export interface IComment extends Document {
  story: Types.ObjectId;
  author: Types.ObjectId;
  authorName: string;
  authorPenName?: string;
  authorAvatar?: string;
  chapterNumber?: number;
  nodeId?: string;
  parentComment?: Types.ObjectId;
  content: string;
  likes: Types.ObjectId[];
  likesCount: number;
  repliesCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateCommentInput {
  content: string;
  chapterNumber?: number;
  nodeId?: string;
  parentCommentId?: string;
}

export interface CommentQueryOptions {
  chapterNumber?: number;
  page?: number;
  limit?: number;
}

import { Document, Types } from 'mongoose';

export interface IDiscussionReply {
  _id?: Types.ObjectId;
  author: Types.ObjectId;
  authorName: string;
  authorPenName?: string;
  authorAvatar?: string;
  content: string;
  likes: Types.ObjectId[];
  createdAt: Date;
}

export interface IDiscussion extends Document {
  author: Types.ObjectId;
  authorName: string;
  authorPenName?: string;
  authorAvatar?: string;
  title: string;
  content: string;
  tradition?: string;
  tags: string[];
  likes: Types.ObjectId[];
  likesCount: number;
  replies: IDiscussionReply[];
  repliesCount: number;
  isPinned: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateDiscussionInput {
  title: string;
  content: string;
  tradition?: string;
  tags?: string[];
}

export interface DiscussionQueryParams {
  tradition?: string;
  search?: string;
  sortBy?: 'recent' | 'popular';
  page?: number;
  limit?: number;
}

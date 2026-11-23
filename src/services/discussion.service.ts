import { Types } from 'mongoose';
import Discussion from '../models/discussion.model';
import User from '../models/user.model';
import ApiError from '../utils/ApiError';
import {
  CreateDiscussionInput,
  DiscussionQueryParams,
} from '../interfaces/discussion.interface';
import { createNotification } from './notification.service';

/**
 * Retrieves paginated discussions for Community Lore Agora.
 */
export const getDiscussions = async (
  params: DiscussionQueryParams,
  currentUserId?: string
): Promise<{
  discussions: any[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}> => {
  const page = Math.max(1, Number(params.page) || 1);
  const limit = Math.max(1, Math.min(100, Number(params.limit) || 20));
  const skip = (page - 1) * limit;

  const filter: any = {};
  if (params.tradition && params.tradition !== 'all' && params.tradition !== 'All') {
    filter.tradition = { $regex: new RegExp(`^${params.tradition.trim()}$`, 'i') };
  }

  if (params.search && params.search.trim()) {
    const regex = new RegExp(params.search.trim(), 'i');
    filter.$or = [{ title: regex }, { content: regex }, { tags: regex }];
  }

  const sort: any = {};
  if (params.sortBy === 'popular') {
    sort.likesCount = -1;
    sort.createdAt = -1;
  } else {
    sort.createdAt = -1;
  }

  const [total, items] = await Promise.all([
    Discussion.countDocuments(filter),
    Discussion.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(),
  ]);

  const formatted = items.map((d) => ({
    id: d._id.toString(),
    title: d.title,
    content: d.content,
    tradition: d.tradition,
    tags: d.tags || [],
    author: {
      id: d.author.toString(),
      name: d.authorName,
      penName: d.authorPenName || d.authorName,
      avatarUrl: d.authorAvatar || '',
    },
    likesCount: d.likesCount || 0,
    repliesCount: d.repliesCount || (d.replies || []).length,
    isLiked: currentUserId ? (d.likes || []).some((l: any) => l.toString() === currentUserId) : false,
    isPinned: d.isPinned || false,
    createdAt: d.createdAt,
    updatedAt: d.updatedAt,
  }));

  return {
    discussions: formatted,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit) || 1,
  };
};

/**
 * Retrieves a single discussion with its replies.
 */
export const getDiscussionById = async (
  id: string,
  currentUserId?: string
): Promise<any> => {
  if (!Types.ObjectId.isValid(id)) {
    throw new ApiError(404, 'Discussion not found');
  }

  const discussion = await Discussion.findById(id).lean();
  if (!discussion) {
    throw new ApiError(404, 'Discussion not found');
  }

  const formattedReplies = (discussion.replies || []).map((r) => ({
    id: r._id?.toString(),
    author: {
      id: r.author.toString(),
      name: r.authorName,
      penName: r.authorPenName || r.authorName,
      avatarUrl: r.authorAvatar || '',
    },
    content: r.content,
    likesCount: (r.likes || []).length,
    isLiked: currentUserId ? (r.likes || []).some((l: any) => l.toString() === currentUserId) : false,
    createdAt: r.createdAt,
  }));

  return {
    id: discussion._id.toString(),
    title: discussion.title,
    content: discussion.content,
    tradition: discussion.tradition,
    tags: discussion.tags || [],
    author: {
      id: discussion.author.toString(),
      name: discussion.authorName,
      penName: discussion.authorPenName || discussion.authorName,
      avatarUrl: discussion.authorAvatar || '',
    },
    likesCount: discussion.likesCount || 0,
    repliesCount: formattedReplies.length,
    isLiked: currentUserId ? (discussion.likes || []).some((l: any) => l.toString() === currentUserId) : false,
    isPinned: discussion.isPinned || false,
    replies: formattedReplies,
    createdAt: discussion.createdAt,
    updatedAt: discussion.updatedAt,
  };
};

/**
 * Creates a new discussion in Community Lore Agora.
 */
export const createDiscussion = async (
  userId: string,
  input: CreateDiscussionInput
): Promise<any> => {
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  const discussion = await Discussion.create({
    author: user._id,
    authorName: user.name,
    authorPenName: user.penName || user.name,
    authorAvatar: user.avatarUrl,
    title: input.title.trim(),
    content: input.content.trim(),
    tradition: input.tradition || 'General Lore',
    tags: input.tags || [],
    likes: [],
    likesCount: 0,
    replies: [],
    repliesCount: 0,
  });

  return {
    id: discussion._id.toString(),
    title: discussion.title,
    content: discussion.content,
    tradition: discussion.tradition,
    tags: discussion.tags,
    author: {
      id: user._id.toString(),
      name: user.name,
      penName: user.penName || user.name,
      avatarUrl: user.avatarUrl || '',
    },
    likesCount: 0,
    repliesCount: 0,
    isLiked: false,
    isPinned: false,
    createdAt: discussion.createdAt,
  };
};

/**
 * Adds a reply to a discussion.
 */
export const addReply = async (
  userId: string,
  discussionId: string,
  content: string
): Promise<any> => {
  const [user, discussion] = await Promise.all([
    User.findById(userId),
    Discussion.findById(discussionId),
  ]);

  if (!user) throw new ApiError(404, 'User not found');
  if (!discussion) throw new ApiError(404, 'Discussion not found');

  if (!content || !content.trim()) {
    throw new ApiError(400, 'Reply content cannot be empty');
  }

  const newReply = {
    _id: new Types.ObjectId(),
    author: user._id,
    authorName: user.name,
    authorPenName: user.penName || user.name,
    authorAvatar: user.avatarUrl,
    content: content.trim(),
    likes: [],
    createdAt: new Date(),
  };

  discussion.replies.push(newReply as any);
  discussion.repliesCount = discussion.replies.length;
  await discussion.save();

  // Notify discussion author
  await createNotification({
    recipient: discussion.author,
    actor: user._id,
    actorName: user.penName || user.name,
    actorAvatar: user.avatarUrl,
    type: 'comment',
    title: 'New Reply in Agora',
    message: `${user.penName || user.name} replied to your topic "${discussion.title}": "${content.slice(0, 50)}..."`,
    link: `/community`,
    metadata: { discussionId: discussion._id, replyId: newReply._id },
  });

  return {
    id: newReply._id.toString(),
    author: {
      id: user._id.toString(),
      name: user.name,
      penName: user.penName || user.name,
      avatarUrl: user.avatarUrl || '',
    },
    content: newReply.content,
    likesCount: 0,
    isLiked: false,
    createdAt: newReply.createdAt,
  };
};

/**
 * Toggles like on a discussion.
 */
export const likeDiscussion = async (
  userId: string,
  discussionId: string
): Promise<{ isLiked: boolean; likesCount: number }> => {
  const discussion = await Discussion.findById(discussionId);
  if (!discussion) {
    throw new ApiError(404, 'Discussion not found');
  }

  const userObjectId = new Types.ObjectId(userId);
  const alreadyLiked = (discussion.likes || []).some((l) => l.toString() === userId);

  if (alreadyLiked) {
    await Discussion.findByIdAndUpdate(discussionId, {
      $pull: { likes: userObjectId },
      $inc: { likesCount: -1 },
    });
    return { isLiked: false, likesCount: Math.max(0, discussion.likesCount - 1) };
  } else {
    await Discussion.findByIdAndUpdate(discussionId, {
      $addToSet: { likes: userObjectId },
      $inc: { likesCount: 1 },
    });

    const user = await User.findById(userId);
    await createNotification({
      recipient: discussion.author,
      actor: user?._id,
      actorName: user?.penName || user?.name || 'A storyteller',
      actorAvatar: user?.avatarUrl,
      type: 'like',
      title: 'Agora Post Liked',
      message: `${user?.penName || user?.name || 'A storyteller'} liked your discussion "${discussion.title}"`,
      link: `/community`,
      metadata: { discussionId: discussion._id },
    });

    return { isLiked: true, likesCount: discussion.likesCount + 1 };
  }
};

/**
 * Deletes a discussion topic.
 */
export const deleteDiscussion = async (
  userId: string,
  discussionId: string
): Promise<void> => {
  const discussion = await Discussion.findById(discussionId);
  if (!discussion) {
    throw new ApiError(404, 'Discussion not found');
  }

  if (discussion.author.toString() !== userId) {
    throw new ApiError(403, 'You are not authorized to delete this discussion');
  }

  await Discussion.findByIdAndDelete(discussionId);
};

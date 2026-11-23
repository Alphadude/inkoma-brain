import { Types } from 'mongoose';
import Comment from '../models/comment.model';
import Story from '../models/story.model';
import User from '../models/user.model';
import ApiError from '../utils/ApiError';
import { CreateCommentInput, CommentQueryOptions } from '../interfaces/comment.interface';
import { createNotification } from './notification.service';

/**
 * Retrieves comments for a story or specific chapter.
 */
export const getComments = async (
  storyIdOrSlug: string,
  options: CommentQueryOptions = {},
  currentUserId?: string
): Promise<{
  comments: any[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}> => {
  const isObjectId = Types.ObjectId.isValid(storyIdOrSlug);
  const story = await Story.findOne(
    isObjectId ? { $or: [{ _id: storyIdOrSlug }, { slug: storyIdOrSlug }] } : { slug: storyIdOrSlug }
  );

  if (!story) {
    throw new ApiError(404, 'Story not found');
  }

  const page = Math.max(1, Number(options.page) || 1);
  const limit = Math.max(1, Math.min(100, Number(options.limit) || 20));
  const skip = (page - 1) * limit;

  const filter: any = { story: story._id, parentComment: null };
  if (options.chapterNumber !== undefined && options.chapterNumber !== null && !isNaN(Number(options.chapterNumber))) {
    filter.chapterNumber = Number(options.chapterNumber);
  }

  const [total, comments] = await Promise.all([
    Comment.countDocuments(filter),
    Comment.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
  ]);

  // Fetch replies for root comments
  const rootCommentIds = comments.map((c) => c._id);
  const replies = await Comment.find({ parentComment: { $in: rootCommentIds } })
    .sort({ createdAt: 1 })
    .lean();

  const repliesByParent = new Map<string, any[]>();
  for (const reply of replies) {
    const parentId = reply.parentComment!.toString();
    if (!repliesByParent.has(parentId)) {
      repliesByParent.set(parentId, []);
    }
    repliesByParent.get(parentId)!.push({
      id: reply._id.toString(),
      author: {
        id: reply.author.toString(),
        name: reply.authorName,
        penName: reply.authorPenName || reply.authorName,
        avatarUrl: reply.authorAvatar || '',
      },
      content: reply.content,
      likesCount: reply.likesCount || 0,
      isLiked: currentUserId ? (reply.likes || []).some((l: any) => l.toString() === currentUserId) : false,
      createdAt: reply.createdAt,
    });
  }

  const formattedComments = comments.map((c) => ({
    id: c._id.toString(),
    storyId: story._id.toString(),
    author: {
      id: c.author.toString(),
      name: c.authorName,
      penName: c.authorPenName || c.authorName,
      avatarUrl: c.authorAvatar || '',
    },
    chapterNumber: c.chapterNumber,
    nodeId: c.nodeId,
    content: c.content,
    likesCount: c.likesCount || 0,
    repliesCount: c.repliesCount || (repliesByParent.get(c._id.toString()) || []).length,
    isLiked: currentUserId ? (c.likes || []).some((l: any) => l.toString() === currentUserId) : false,
    replies: repliesByParent.get(c._id.toString()) || [],
    createdAt: c.createdAt,
  }));

  return {
    comments: formattedComments,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit) || 1,
  };
};

/**
 * Creates a new comment or reply on a story.
 */
export const createComment = async (
  userId: string,
  storyIdOrSlug: string,
  input: CreateCommentInput
): Promise<any> => {
  const [user, story] = await Promise.all([
    User.findById(userId),
    Story.findOne(
      Types.ObjectId.isValid(storyIdOrSlug)
        ? { $or: [{ _id: storyIdOrSlug }, { slug: storyIdOrSlug }] }
        : { slug: storyIdOrSlug }
    ),
  ]);

  if (!user) throw new ApiError(404, 'User not found');
  if (!story) throw new ApiError(404, 'Story not found');

  if (!input.content || !input.content.trim()) {
    throw new ApiError(400, 'Comment content cannot be empty');
  }

  let parentComment: any = null;
  if (input.parentCommentId) {
    parentComment = await Comment.findById(input.parentCommentId);
    if (!parentComment) {
      throw new ApiError(404, 'Parent comment not found');
    }
  }

  const comment = await Comment.create({
    story: story._id,
    author: user._id,
    authorName: user.name,
    authorPenName: user.penName || user.name,
    authorAvatar: user.avatarUrl,
    chapterNumber: input.chapterNumber,
    nodeId: input.nodeId,
    parentComment: parentComment ? parentComment._id : undefined,
    content: input.content.trim(),
    likes: [],
    likesCount: 0,
    repliesCount: 0,
  });

  // Increment story comments count
  await Story.findByIdAndUpdate(story._id, { $inc: { commentsCount: 1 } });

  // If replying to a parent comment
  if (parentComment) {
    await Comment.findByIdAndUpdate(parentComment._id, { $inc: { repliesCount: 1 } });

    // Notify parent comment author
    await createNotification({
      recipient: parentComment.author,
      actor: user._id,
      actorName: user.penName || user.name,
      actorAvatar: user.avatarUrl,
      type: 'comment',
      title: 'Reply to your comment',
      message: `${user.penName || user.name} replied: "${input.content.trim().slice(0, 60)}..."`,
      link: `/story/${story.slug || story._id}`,
      metadata: { storyId: story._id, commentId: comment._id },
    });
  } else {
    // Notify story author
    await createNotification({
      recipient: story.author,
      actor: user._id,
      actorName: user.penName || user.name,
      actorAvatar: user.avatarUrl,
      type: 'comment',
      title: input.chapterNumber ? `New Chapter ${input.chapterNumber} Comment` : 'New Story Comment',
      message: `${user.penName || user.name} commented on "${story.title}": "${input.content.trim().slice(0, 60)}..."`,
      link: `/story/${story.slug || story._id}`,
      metadata: { storyId: story._id, commentId: comment._id },
    });
  }

  return {
    id: comment._id.toString(),
    storyId: story._id.toString(),
    author: {
      id: user._id.toString(),
      name: user.name,
      penName: user.penName || user.name,
      avatarUrl: user.avatarUrl || '',
    },
    chapterNumber: comment.chapterNumber,
    nodeId: comment.nodeId,
    content: comment.content,
    likesCount: 0,
    repliesCount: 0,
    isLiked: false,
    createdAt: comment.createdAt,
  };
};

/**
 * Toggles like / unlike on a comment.
 */
export const likeComment = async (
  userId: string,
  commentId: string
): Promise<{ isLiked: boolean; likesCount: number }> => {
  const comment = await Comment.findById(commentId);
  if (!comment) {
    throw new ApiError(404, 'Comment not found');
  }

  const userObjectId = new Types.ObjectId(userId);
  const alreadyLiked = (comment.likes || []).some((l) => l.toString() === userId);

  if (alreadyLiked) {
    await Comment.findByIdAndUpdate(commentId, {
      $pull: { likes: userObjectId },
      $inc: { likesCount: -1 },
    });
    return { isLiked: false, likesCount: Math.max(0, comment.likesCount - 1) };
  } else {
    await Comment.findByIdAndUpdate(commentId, {
      $addToSet: { likes: userObjectId },
      $inc: { likesCount: 1 },
    });

    const user = await User.findById(userId);
    await createNotification({
      recipient: comment.author,
      actor: user?._id,
      actorName: user?.penName || user?.name || 'A reader',
      actorAvatar: user?.avatarUrl,
      type: 'like',
      title: 'Comment Liked',
      message: `${user?.penName || user?.name || 'A reader'} liked your comment: "${comment.content.slice(0, 50)}..."`,
      link: `/story/${comment.story}`,
      metadata: { commentId: comment._id },
    });

    return { isLiked: true, likesCount: comment.likesCount + 1 };
  }
};

/**
 * Deletes a comment and updates counters.
 */
export const deleteComment = async (
  userId: string,
  commentId: string
): Promise<void> => {
  const comment = await Comment.findById(commentId);
  if (!comment) {
    throw new ApiError(404, 'Comment not found');
  }

  if (comment.author.toString() !== userId) {
    throw new ApiError(403, 'You are not authorized to delete this comment');
  }

  await Comment.findByIdAndDelete(commentId);

  // Also delete child replies if it's a parent
  const deletedReplies = await Comment.deleteMany({ parentComment: commentId });
  const totalDeleted = 1 + (deletedReplies.deletedCount || 0);

  // Decrement story comments count
  await Story.findByIdAndUpdate(comment.story, {
    $inc: { commentsCount: -totalDeleted },
  });

  if (comment.parentComment) {
    await Comment.findByIdAndUpdate(comment.parentComment, {
      $inc: { repliesCount: -1 },
    });
  }
};

import { Types } from 'mongoose';
import User from '../models/user.model';
import Story from '../models/story.model';
import ApiError from '../utils/ApiError';
import {
  IUser,
  UpdateProfileInput,
  UpdateBankingInput,
  ChangePasswordInput,
  UpdatePrivacyInput,
  UpdateNotificationsInput,
  UpdateProgressInput,
  CreateQuoteInput,
} from '../interfaces/user.interface';

/**
 * Get current user profile with banking, privacy, and notifications populated.
 */
export const getMe = async (userId: string): Promise<IUser> => {
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, 'User not found');
  }
  return user;
};

/**
 * Update current user profile fields (name, username, penName, bio, phone, avatarUrl).
 */
export const updateProfile = async (
  userId: string,
  data: UpdateProfileInput
): Promise<IUser> => {
  if (data.username) {
    const normalizedUsername = data.username.toLowerCase();
    const existing = await User.findOne({
      username: normalizedUsername,
      _id: { $ne: userId },
    });
    if (existing) {
      throw new ApiError(409, 'Username is already taken');
    }
    data.username = normalizedUsername;
  }

  const user = await User.findByIdAndUpdate(
    userId,
    { $set: data },
    { new: true, runValidators: true }
  );

  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  return user;
};

/**
 * Update user payout banking details.
 */
export const updateBanking = async (
  userId: string,
  data: UpdateBankingInput
): Promise<IUser> => {
  const user = await User.findByIdAndUpdate(
    userId,
    { $set: { banking: data } },
    { new: true, runValidators: true }
  );

  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  return user;
};

/**
 * Securely change password after checking current password.
 */
export const changePassword = async (
  userId: string,
  data: ChangePasswordInput
): Promise<void> => {
  const user = await User.findById(userId).select('+password');
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  const isMatch = await user.comparePassword(data.currentPassword);
  if (!isMatch) {
    throw new ApiError(400, 'Current password is incorrect');
  }

  user.password = data.newPassword;
  await user.save();
};

/**
 * Update privacy settings.
 */
export const updatePrivacy = async (
  userId: string,
  data: UpdatePrivacyInput
): Promise<IUser> => {
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  user.privacy = {
    ...user.toObject().privacy,
    ...data,
  };

  await user.save();
  return user;
};

/**
 * Update notification preferences.
 */
export const updateNotifications = async (
  userId: string,
  data: UpdateNotificationsInput
): Promise<IUser> => {
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  user.notifications = {
    ...user.toObject().notifications,
    ...data,
  };

  await user.save();
  return user;
};

/**
 * Retrieves top authors ranked by cumulative story reads.
 */
export const getTopAuthors = async (limit: number = 10): Promise<any[]> => {
  const authorsAgg = await Story.aggregate([
    { $match: { status: { $in: ['ongoing', 'completed'] } } },
    {
      $group: {
        _id: '$author',
        authorName: { $first: '$authorName' },
        authorPenName: { $first: '$authorPenName' },
        authorAvatar: { $first: '$authorAvatar' },
        totalReads: { $sum: '$readsCount' },
        totalLikes: { $sum: '$likesCount' },
        storiesCount: { $sum: 1 },
      },
    },
    { $sort: { totalReads: -1, totalLikes: -1 } },
    { $limit: limit },
  ]);

  return authorsAgg.map((a, idx) => ({
    id: a._id ? a._id.toString() : `author-${idx + 1}`,
    rank: idx + 1,
    name: a.authorPenName || a.authorName || 'Storyteller',
    reads: `${a.totalReads || 0} Reads`,
    totalReads: a.totalReads || 0,
    totalLikes: a.totalLikes || 0,
    storiesCount: a.storiesCount || 0,
    avatar:
      a.authorAvatar ||
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=300&auto=format&fit=crop',
  }));
};

/**
 * Retrieves list of bookmarked stories for current user.
 */
export const getBookmarks = async (userId: string): Promise<any[]> => {
  const user = await User.findById(userId).populate({
    path: 'bookmarks',
    model: 'Story',
  });

  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  return user.bookmarks || [];
};

/**
 * Adds a story to the user's bookmarks.
 */
export const addBookmark = async (userId: string, storyId: string): Promise<void> => {
  const story = await Story.findById(storyId);
  if (!story) {
    throw new ApiError(404, 'Story not found');
  }

  const storyObjectId = new Types.ObjectId(storyId);
  const userUpdated = await User.findOneAndUpdate(
    { _id: userId, bookmarks: { $ne: storyObjectId } },
    { $addToSet: { bookmarks: storyObjectId } }
  );

  if (userUpdated) {
    await Story.findByIdAndUpdate(storyId, {
      $inc: { bookmarksCount: 1 },
    });
  }
};

/**
 * Removes a story from the user's bookmarks.
 */
export const removeBookmark = async (userId: string, storyId: string): Promise<void> => {
  const storyObjectId = new Types.ObjectId(storyId);
  const userUpdated = await User.findOneAndUpdate(
    { _id: userId, bookmarks: storyObjectId },
    { $pull: { bookmarks: storyObjectId } }
  );

  if (userUpdated) {
    await Story.findByIdAndUpdate(storyId, {
      $inc: { bookmarksCount: -1 },
    });
  }
};

/**
 * Retrieves aggregate personal library data & counters.
 */
export const getLibraryOverview = async (userId: string): Promise<any> => {
  const user = await User.findById(userId)
    .populate({ path: 'bookmarks', model: 'Story' })
    .populate({ path: 'favorites', model: 'Story' });

  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  const recentlyRead = (user.readingProgress || []).sort(
    (a, b) => new Date(b.lastReadAt).getTime() - new Date(a.lastReadAt).getTime()
  );

  const savedQuotes = (user.savedQuotes || []).sort(
    (a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime()
  );

  return {
    recentlyRead,
    bookmarks: user.bookmarks || [],
    favorites: user.favorites || [],
    savedQuotes,
    counts: {
      recentlyRead: recentlyRead.length,
      bookmarks: (user.bookmarks || []).length,
      favorites: (user.favorites || []).length,
      savedQuotes: savedQuotes.length,
      total:
        recentlyRead.length +
        (user.bookmarks || []).length +
        (user.favorites || []).length +
        savedQuotes.length,
    },
  };
};

/**
 * Clears all library items (reading progress, bookmarks, favorites, and saved quotes).
 */
export const clearLibrary = async (userId: string): Promise<void> => {
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  user.readingProgress = [];
  user.bookmarks = [];
  user.favorites = [];
  user.savedQuotes = [];

  await user.save();
};

/**
 * Retrieves reading progress / recently read list.
 */
export const getReadingProgress = async (userId: string): Promise<any[]> => {
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  return (user.readingProgress || []).sort(
    (a, b) => new Date(b.lastReadAt).getTime() - new Date(a.lastReadAt).getTime()
  );
};

/**
 * Upserts reading progress for a story.
 */
export const upsertReadingProgress = async (
  userId: string,
  storyId: string,
  data: UpdateProgressInput
): Promise<any> => {
  const [user, story] = await Promise.all([
    User.findById(userId),
    Story.findById(storyId),
  ]);

  if (!user) throw new ApiError(404, 'User not found');
  if (!story) throw new ApiError(404, 'Story not found');

  const storyObjectId = new Types.ObjectId(storyId);

  // Filter out any existing progress entry for this story
  const filtered = (user.readingProgress || []).filter(
    (p) => p.story.toString() !== storyId
  );

  const newEntry = {
    story: storyObjectId,
    storyTitle: story.title,
    coverImage: story.coverImage || '',
    authorPenName: story.authorPenName || story.authorName || 'Storyteller',
    lastChapterNumber: data.lastChapterNumber,
    progressPercentage: data.progressPercentage,
    lastReadNodeId: data.lastReadNodeId,
    lastReadAt: new Date(),
  };

  user.readingProgress = [newEntry, ...filtered];
  await user.save();

  return newEntry;
};

/**
 * Removes a story from reading history / progress.
 */
export const removeReadingProgress = async (
  userId: string,
  storyId: string
): Promise<void> => {
  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, 'User not found');

  user.readingProgress = (user.readingProgress || []).filter(
    (p) => p.story.toString() !== storyId
  );

  await user.save();
};

/**
 * Retrieves user favorites.
 */
export const getFavorites = async (userId: string): Promise<any[]> => {
  const user = await User.findById(userId).populate({
    path: 'favorites',
    model: 'Story',
  });

  if (!user) throw new ApiError(404, 'User not found');
  return user.favorites || [];
};

/**
 * Adds a story to favorites.
 */
export const addFavorite = async (userId: string, storyId: string): Promise<void> => {
  const story = await Story.findById(storyId);
  if (!story) throw new ApiError(404, 'Story not found');

  const storyObjectId = new Types.ObjectId(storyId);
  const userUpdated = await User.findOneAndUpdate(
    { _id: userId, favorites: { $ne: storyObjectId } },
    { $addToSet: { favorites: storyObjectId } }
  );

  if (userUpdated) {
    await Story.findByIdAndUpdate(storyId, {
      $inc: { likesCount: 1 },
    });
  }
};

/**
 * Removes a story from favorites.
 */
export const removeFavorite = async (userId: string, storyId: string): Promise<void> => {
  const storyObjectId = new Types.ObjectId(storyId);
  const userUpdated = await User.findOneAndUpdate(
    { _id: userId, favorites: storyObjectId },
    { $pull: { favorites: storyObjectId } }
  );

  if (userUpdated) {
    await Story.findByIdAndUpdate(storyId, {
      $inc: { likesCount: -1 },
    });
  }
};

/**
 * Retrieves saved quotes.
 */
export const getQuotes = async (userId: string): Promise<any[]> => {
  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, 'User not found');

  return (user.savedQuotes || []).sort(
    (a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime()
  );
};

/**
 * Adds a new quote.
 */
export const addQuote = async (
  userId: string,
  data: CreateQuoteInput
): Promise<any> => {
  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, 'User not found');

  let storyTitle = data.storyTitle;
  let authorPenName = data.authorPenName;

  if (!storyTitle) {
    const story = await Story.findById(data.storyId);
    if (story) {
      storyTitle = story.title;
      authorPenName = authorPenName || story.authorPenName || story.authorName;
    }
  }

  const newQuote = {
    _id: new Types.ObjectId(),
    story: new Types.ObjectId(data.storyId),
    storyTitle: storyTitle || 'Story',
    authorPenName: authorPenName || 'Storyteller',
    chapterNumber: data.chapterNumber,
    chapterTitle: data.chapterTitle,
    quoteText: data.quoteText,
    savedAt: new Date(),
  };

  user.savedQuotes = [newQuote, ...(user.savedQuotes || [])];
  await user.save();

  return newQuote;
};

/**
 * Removes a saved quote by quoteId.
 */
export const removeQuote = async (userId: string, quoteId: string): Promise<void> => {
  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, 'User not found');

  user.savedQuotes = (user.savedQuotes || []).filter(
    (q) => q._id?.toString() !== quoteId
  );

  await user.save();
};

/**
 * Retrieves public profile by username or userId.
 */
export const getPublicProfile = async (
  usernameOrId: string,
  currentUserId?: string
): Promise<any> => {
  const isObjectId = Types.ObjectId.isValid(usernameOrId);
  const query = isObjectId
    ? { _id: usernameOrId }
    : { username: usernameOrId.toLowerCase() };

  let user = await User.findOne(query);
  if (!user && !isObjectId) {
    // Fallback: match by name or penName if no username set
    user = await User.findOne({
      $or: [
        { name: new RegExp(`^${usernameOrId.replace(/_/g, ' ')}$`, 'i') },
        { penName: new RegExp(`^${usernameOrId.replace(/_/g, ' ')}$`, 'i') },
      ],
    });
  }

  if (!user) {
    throw new ApiError(404, 'Storyteller not found');
  }

  // Aggregate author writing statistics
  const statsAgg = await Story.aggregate([
    { $match: { author: user._id } },
    {
      $group: {
        _id: null,
        storiesPublished: {
          $sum: { $cond: [{ $in: ['$status', ['ongoing', 'completed']] }, 1, 0] },
        },
        draftStories: {
          $sum: { $cond: [{ $eq: ['$status', 'draft'] }, 1, 0] },
        },
        totalReads: { $sum: '$readsCount' },
        totalLikes: { $sum: '$likesCount' },
        totalComments: { $sum: '$commentsCount' },
        totalChaptersPublished: { $sum: { $size: { $ifNull: ['$chapters', []] } } },
      },
    },
  ]);

  const stats = statsAgg[0] || {
    storiesPublished: 0,
    draftStories: 0,
    totalReads: 0,
    totalLikes: 0,
    totalComments: 0,
    totalChaptersPublished: 0,
  };

  const isFollowing = currentUserId
    ? (user.followers || []).some((f) => f.toString() === currentUserId)
    : false;

  const defaultBadges = [
    {
      id: 'badge-initiate',
      name: 'Storyteller Initiate',
      description: 'Preserving African folklore & oral heritage',
      iconName: 'Crown',
      tier: 'bronze',
      unlockedAt: user.createdAt,
    },
  ];

  const supportDetails = user.supportDetails || (user.banking?.accountNumber ? {
    isAcceptingSupport: true,
    bankName: user.banking.bankName,
    accountNumber: user.banking.accountNumber,
    accountHolderName: user.banking.accountHolderName,
  } : {
    isAcceptingSupport: true,
  });

  const showReading = user.privacy?.publicReadingHistory || (currentUserId === user._id.toString());
  const booksRead = (user.readingProgress || []).filter((p) => p.progressPercentage >= 100).length;
  const chaptersRead = (user.readingProgress || []).reduce((sum, p) => sum + (p.lastChapterNumber || 1), 0);

  return {
    id: user._id.toString(),
    username: user.username || user.name.toLowerCase().replace(/\s+/g, '_'),
    displayName: user.name,
    penName: user.penName || user.name,
    bio: user.bio || 'Preserving ancestral lore through interactive storytelling.',
    avatarUrl: user.avatarUrl || '',
    country: user.country || 'Pan-African',
    role: user.role || 'storyteller',
    traditionSpecialty: user.traditionSpecialty || 'Pan-African Folklore',
    createdAt: user.createdAt,
    followersCount: user.followersCount || (user.followers || []).length,
    followingCount: user.followingCount || (user.following || []).length,
    isFollowing,
    badges: (user.badges && user.badges.length > 0) ? user.badges : defaultBadges,
    writingStats: stats,
    readingStats: showReading
      ? {
          booksRead,
          chaptersRead,
          readingStreakDays: Math.min(30, (user.readingProgress || []).length * 3),
          favoriteGenres: ['Folklore', 'Mythology'],
          interests: ['African Myths', 'Oral Traditions'],
        }
      : undefined,
    supportDetails,
  };
};

/**
 * Follow a storyteller.
 */
export const followUser = async (
  currentUserId: string,
  targetUserId: string
): Promise<void> => {
  if (currentUserId === targetUserId) {
    throw new ApiError(400, 'You cannot follow yourself');
  }

  const target = await User.findById(targetUserId);
  if (!target) {
    throw new ApiError(404, 'User not found');
  }

  if (target.privacy?.allowFollowers === false) {
    throw new ApiError(403, 'This storyteller is not accepting new followers');
  }

  const currentUserObjectId = new Types.ObjectId(currentUserId);
  const targetUserObjectId = new Types.ObjectId(targetUserId);

  // Atomically update target user ONLY if not already in followers
  const targetUpdated = await User.findOneAndUpdate(
    { _id: targetUserObjectId, followers: { $ne: currentUserObjectId } },
    {
      $addToSet: { followers: currentUserObjectId },
      $inc: { followersCount: 1 },
    },
    { new: true }
  );

  // If already was following, targetUpdated will be null -> idempotent no-op
  if (!targetUpdated) {
    return;
  }

  await User.findByIdAndUpdate(currentUserId, {
    $addToSet: { following: targetUserObjectId },
    $inc: { followingCount: 1 },
  });

  const follower = await User.findById(currentUserId).lean();
  if (follower) {
    try {
      const { createNotification } = await import('./notification.service');
      await createNotification({
        recipient: targetUserId,
        actor: currentUserId,
        actorName: (follower as any).penName || (follower as any).name,
        actorAvatar: (follower as any).avatarUrl,
        type: 'follow',
        title: 'New Storyteller Follower',
        message: `${(follower as any).penName || (follower as any).name} started following your stories!`,
        link: `/profile/${(follower as any).username || currentUserId}`,
      });
    } catch {
      // Soft ignore notification error
    }
  }
};

/**
 * Unfollow a storyteller.
 */
export const unfollowUser = async (
  currentUserId: string,
  targetUserId: string
): Promise<void> => {
  const target = await User.findById(targetUserId);
  if (!target) {
    throw new ApiError(404, 'User not found');
  }

  const currentUserObjectId = new Types.ObjectId(currentUserId);
  const targetUserObjectId = new Types.ObjectId(targetUserId);

  // Atomically update target user ONLY if currently in followers
  const targetUpdated = await User.findOneAndUpdate(
    { _id: targetUserObjectId, followers: currentUserObjectId },
    {
      $pull: { followers: currentUserObjectId },
      $inc: { followersCount: -1 },
    },
    { new: true }
  );

  // If was not following, targetUpdated will be null -> idempotent no-op
  if (!targetUpdated) {
    return;
  }

  await User.findByIdAndUpdate(currentUserId, {
    $pull: { following: targetUserObjectId },
    $inc: { followingCount: -1 },
  });
};

/**
 * Get follow status between current user and target user.
 */
export const getFollowStatus = async (
  currentUserId: string,
  targetUserId: string
): Promise<{ isFollowing: boolean }> => {
  const target = await User.findById(targetUserId);
  if (!target) {
    throw new ApiError(404, 'User not found');
  }

  const isFollowing = (target.followers || []).some(
    (f) => f.toString() === currentUserId
  );
  return { isFollowing };
};

/**
 * Get author support / tipping details.
 */
export const getAuthorSupport = async (usernameOrId: string): Promise<any> => {
  const isObjectId = Types.ObjectId.isValid(usernameOrId);
  const query = isObjectId
    ? { _id: usernameOrId }
    : { username: usernameOrId.toLowerCase() };

  const user = await User.findOne(query);
  if (!user) {
    throw new ApiError(404, 'Storyteller not found');
  }

  const supportDetails = user.supportDetails || (user.banking?.accountNumber ? {
    isAcceptingSupport: true,
    bankName: user.banking.bankName,
    accountNumber: user.banking.accountNumber,
    accountHolderName: user.banking.accountHolderName,
  } : {
    isAcceptingSupport: false,
  });

  return {
    authorId: user._id.toString(),
    authorName: user.name,
    penName: user.penName || user.name,
    username: user.username,
    supportDetails,
  };
};

export interface NetworkQueryOptions {
  page?: number;
  limit?: number;
  search?: string;
}

/**
 * Get followers list for a user / storyteller.
 */
export const getFollowers = async (
  username: string,
  currentUserId?: string,
  options: NetworkQueryOptions = {}
): Promise<{
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  users: any[];
}> => {
  const isObjectId = Types.ObjectId.isValid(username);
  const targetUser = await User.findOne(
    isObjectId
      ? { $or: [{ _id: username }, { username: username.toLowerCase() }] }
      : { username: username.toLowerCase() }
  );

  if (!targetUser) {
    throw new ApiError(404, 'User not found');
  }

  const page = Math.max(1, Number(options.page) || 1);
  const limit = Math.max(1, Math.min(100, Number(options.limit) || 20));
  const skip = (page - 1) * limit;

  const followerIds = targetUser.followers || [];
  const filter: any = { _id: { $in: followerIds } };

  if (options.search && options.search.trim()) {
    const regex = new RegExp(options.search.trim(), 'i');
    filter.$or = [
      { name: regex },
      { username: regex },
      { penName: regex },
      { traditionSpecialty: regex },
    ];
  }

  const [total, users] = await Promise.all([
    User.countDocuments(filter),
    User.find(filter)
      .select('name username penName avatarUrl country traditionSpecialty followers followersCount following')
      .skip(skip)
      .limit(limit)
      .lean(),
  ]);

  let viewerFollowingSet = new Set<string>();
  if (currentUserId) {
    const viewer = await User.findById(currentUserId).select('following').lean();
    if (viewer && viewer.following) {
      viewerFollowingSet = new Set(viewer.following.map((id: any) => id.toString()));
    }
  }

  const formattedUsers = users.map((u: any) => ({
    id: u._id.toString(),
    username: u.username || u.name.toLowerCase().replace(/\s+/g, '_'),
    displayName: u.name,
    penName: u.penName || u.name,
    avatarUrl: u.avatarUrl || '',
    country: u.country || 'Pan-African',
    specialty: u.traditionSpecialty || 'Pan-African Folklore',
    traditionSpecialty: u.traditionSpecialty || 'Pan-African Folklore',
    followersCount: u.followersCount || (u.followers || []).length,
    followingCount: (u.following || []).length,
    isFollowing: currentUserId ? viewerFollowingSet.has(u._id.toString()) : false,
  }));

  return {
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit) || 1,
    users: formattedUsers,
  };
};

/**
 * Get following list for a user / storyteller.
 */
export const getFollowing = async (
  username: string,
  currentUserId?: string,
  options: NetworkQueryOptions = {}
): Promise<{
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  users: any[];
}> => {
  const isObjectId = Types.ObjectId.isValid(username);
  const targetUser = await User.findOne(
    isObjectId
      ? { $or: [{ _id: username }, { username: username.toLowerCase() }] }
      : { username: username.toLowerCase() }
  );

  if (!targetUser) {
    throw new ApiError(404, 'User not found');
  }

  const page = Math.max(1, Number(options.page) || 1);
  const limit = Math.max(1, Math.min(100, Number(options.limit) || 20));
  const skip = (page - 1) * limit;

  const followingIds = targetUser.following || [];
  const filter: any = { _id: { $in: followingIds } };

  if (options.search && options.search.trim()) {
    const regex = new RegExp(options.search.trim(), 'i');
    filter.$or = [
      { name: regex },
      { username: regex },
      { penName: regex },
      { traditionSpecialty: regex },
    ];
  }

  const [total, users] = await Promise.all([
    User.countDocuments(filter),
    User.find(filter)
      .select('name username penName avatarUrl country traditionSpecialty followers followersCount following')
      .skip(skip)
      .limit(limit)
      .lean(),
  ]);

  let viewerFollowingSet = new Set<string>();
  if (currentUserId) {
    const viewer = await User.findById(currentUserId).select('following').lean();
    if (viewer && viewer.following) {
      viewerFollowingSet = new Set(viewer.following.map((id: any) => id.toString()));
    }
  }

  const formattedUsers = users.map((u: any) => ({
    id: u._id.toString(),
    username: u.username || u.name.toLowerCase().replace(/\s+/g, '_'),
    displayName: u.name,
    penName: u.penName || u.name,
    avatarUrl: u.avatarUrl || '',
    country: u.country || 'Pan-African',
    specialty: u.traditionSpecialty || 'Pan-African Folklore',
    traditionSpecialty: u.traditionSpecialty || 'Pan-African Folklore',
    followersCount: u.followersCount || (u.followers || []).length,
    followingCount: (u.following || []).length,
    isFollowing: currentUserId ? viewerFollowingSet.has(u._id.toString()) : false,
  }));

  return {
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit) || 1,
    users: formattedUsers,
  };
};

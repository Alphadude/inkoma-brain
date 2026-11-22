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

  await Promise.all([
    User.findByIdAndUpdate(userId, {
      $addToSet: { bookmarks: story._id },
    }),
    Story.findByIdAndUpdate(storyId, {
      $inc: { bookmarksCount: 1 },
    }),
  ]);
};

/**
 * Removes a story from the user's bookmarks.
 */
export const removeBookmark = async (userId: string, storyId: string): Promise<void> => {
  await Promise.all([
    User.findByIdAndUpdate(userId, {
      $pull: { bookmarks: storyId },
    }),
    Story.findByIdAndUpdate(storyId, {
      $inc: { bookmarksCount: -1 },
    }),
  ]);
};

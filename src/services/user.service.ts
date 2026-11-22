import User from '../models/user.model';
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

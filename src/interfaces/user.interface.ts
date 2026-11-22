import { Document, Types } from 'mongoose';

export type UserRole = 'user' | 'admin';

export interface IBankingDetails {
  bankName: string;
  accountNumber: string;
  accountHolderName: string;
}

export interface IPrivacySettings {
  publicProfile: boolean;
  publicReadingHistory: boolean;
  allowFollowers: boolean;
  showReadingActivity: boolean;
}

export interface INotificationSettings {
  emailNewChapters: boolean;
  emailComments: boolean;
  emailPatronSupport: boolean;
  weeklyFolkloreDigest: boolean;
  newChapterAlerts: boolean;
  commentReplies: boolean;
  patronTips: boolean;
  communityAnnouncements: boolean;
}

export interface IUser extends Document {
  name: string;
  email: string;
  phone?: string;
  username?: string;
  avatarUrl?: string;
  penName?: string;
  bio?: string;
  password: string;
  role: UserRole;
  isEmailVerified: boolean;
  emailVerificationOtp?: string;
  emailVerificationOtpExpires?: Date;
  resetPasswordOtp?: string;
  resetPasswordOtpExpires?: Date;
  banking?: IBankingDetails;
  privacy: IPrivacySettings;
  notifications: INotificationSettings;
  bookmarks: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

export interface UpdateProfileInput {
  name?: string;
  username?: string;
  penName?: string;
  bio?: string;
  phone?: string;
  avatarUrl?: string;
}

export interface UpdateBankingInput {
  bankName: string;
  accountNumber: string;
  accountHolderName: string;
}

export interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
}

export type UpdatePrivacyInput = Partial<IPrivacySettings>;

export type UpdateNotificationsInput = Partial<INotificationSettings>;

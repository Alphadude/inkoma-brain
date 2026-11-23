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

export interface IReadingProgress {
  story: Types.ObjectId;
  storyTitle: string;
  coverImage?: string;
  authorPenName?: string;
  lastChapterNumber: number;
  progressPercentage: number;
  lastReadNodeId?: string;
  lastReadAt: Date;
}

export interface ISavedQuote {
  _id?: Types.ObjectId;
  story: Types.ObjectId;
  storyTitle: string;
  authorPenName?: string;
  chapterNumber: number;
  chapterTitle?: string;
  quoteText: string;
  savedAt: Date;
}

export interface IBadge {
  id: string;
  name: string;
  description: string;
  iconName?: string;
  tier: string; // 'bronze' | 'silver' | 'gold' | 'elder'
  unlockedAt?: Date | string;
}

export interface ISupportDetails {
  isAcceptingSupport: boolean;
  paystackLink?: string;
  bankName?: string;
  accountNumber?: string;
  accountHolderName?: string;
}

export interface IUser extends Document {
  name: string;
  email: string;
  phone?: string;
  username?: string;
  avatarUrl?: string;
  penName?: string;
  bio?: string;
  country?: string;
  traditionSpecialty?: string;
  preferredCategories: string[];
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
  favorites: Types.ObjectId[];
  followers: Types.ObjectId[];
  following: Types.ObjectId[];
  followersCount: number;
  followingCount: number;
  badges: IBadge[];
  supportDetails?: ISupportDetails;
  readingProgress: IReadingProgress[];
  savedQuotes: ISavedQuote[];
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
  traditionSpecialty?: string;
  preferredCategories?: string[];
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

export interface UpdateProgressInput {
  lastChapterNumber: number;
  progressPercentage: number;
  lastReadNodeId?: string;
}

export interface CreateQuoteInput {
  storyId: string;
  storyTitle?: string;
  authorPenName?: string;
  chapterNumber: number;
  chapterTitle?: string;
  quoteText: string;
}

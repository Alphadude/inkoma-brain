import mongoose, { Model, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';
import {
  IUser,
  IBankingDetails,
  IPrivacySettings,
  INotificationSettings,
  IReadingProgress,
  ISavedQuote,
} from '../interfaces/user.interface';

// ── Sub-schemas ───────────────────────────────────────────────────────────
const bankingSchema = new Schema<IBankingDetails>(
  {
    bankName: {
      type: String,
      trim: true,
      required: [true, 'Bank name is required'],
    },
    accountNumber: {
      type: String,
      trim: true,
      required: [true, 'Account number is required'],
    },
    accountHolderName: {
      type: String,
      trim: true,
      required: [true, 'Account holder name is required'],
    },
  },
  { _id: false }
);

const privacySchema = new Schema<IPrivacySettings>(
  {
    publicProfile: {
      type: Boolean,
      default: true,
    },
    publicReadingHistory: {
      type: Boolean,
      default: false,
    },
    allowFollowers: {
      type: Boolean,
      default: true,
    },
    showReadingActivity: {
      type: Boolean,
      default: true,
    },
  },
  { _id: false }
);

const notificationSchema = new Schema<INotificationSettings>(
  {
    emailNewChapters: {
      type: Boolean,
      default: true,
    },
    emailComments: {
      type: Boolean,
      default: true,
    },
    emailPatronSupport: {
      type: Boolean,
      default: true,
    },
    weeklyFolkloreDigest: {
      type: Boolean,
      default: false,
    },
    newChapterAlerts: {
      type: Boolean,
      default: true,
    },
    commentReplies: {
      type: Boolean,
      default: true,
    },
    patronTips: {
      type: Boolean,
      default: true,
    },
    communityAnnouncements: {
      type: Boolean,
      default: true,
    },
  },
  { _id: false }
);

const readingProgressSchema = new Schema<IReadingProgress>(
  {
    story: {
      type: Schema.Types.ObjectId,
      ref: 'Story',
      required: true,
    },
    storyTitle: {
      type: String,
      required: true,
      trim: true,
    },
    coverImage: {
      type: String,
      default: '',
    },
    authorPenName: {
      type: String,
      default: 'Storyteller',
    },
    lastChapterNumber: {
      type: Number,
      required: true,
      default: 1,
    },
    progressPercentage: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
      default: 0,
    },
    lastReadNodeId: {
      type: String,
      trim: true,
    },
    lastReadAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const savedQuoteSchema = new Schema<ISavedQuote>(
  {
    story: {
      type: Schema.Types.ObjectId,
      ref: 'Story',
      required: true,
    },
    storyTitle: {
      type: String,
      required: true,
      trim: true,
    },
    authorPenName: {
      type: String,
      default: 'Storyteller',
    },
    chapterNumber: {
      type: Number,
      required: true,
    },
    chapterTitle: {
      type: String,
      trim: true,
    },
    quoteText: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },
    savedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// ── Main Schema ───────────────────────────────────────────────────────────
const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address'],
    },
    phone: {
      type: String,
      trim: true,
    },
    username: {
      type: String,
      unique: true,
      sparse: true,
      lowercase: true,
      trim: true,
      minlength: [3, 'Username must be at least 3 characters'],
      maxlength: [30, 'Username cannot exceed 30 characters'],
    },
    avatarUrl: {
      type: String,
      trim: true,
    },
    penName: {
      type: String,
      trim: true,
      maxlength: [100, 'Pen name cannot exceed 100 characters'],
    },
    bio: {
      type: String,
      trim: true,
      maxlength: [500, 'Bio cannot exceed 500 characters'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false, // Never returned in queries by default
    },
    resetPasswordOtp: {
      type: String,
      select: false,
    },
    resetPasswordOtpExpires: {
      type: Date,
      select: false,
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    emailVerificationOtp: {
      type: String,
      select: false,
    },
    emailVerificationOtpExpires: {
      type: Date,
      select: false,
    },
    banking: {
      type: bankingSchema,
      default: undefined,
    },
    privacy: {
      type: privacySchema,
      default: () => ({}),
    },
    notifications: {
      type: notificationSchema,
      default: () => ({}),
    },
    bookmarks: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Story',
      },
    ],
    favorites: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Story',
      },
    ],
    readingProgress: [readingProgressSchema],
    savedQuotes: [savedQuoteSchema],
  },
  { timestamps: true }
);

// ── Hash password before save ─────────────────────────────────────────────
userSchema.pre<IUser>('save', async function (next) {
  if (!this.isModified('password')) return next();
  const rounds = parseInt(process.env.BCRYPT_ROUNDS as string, 10) || 12;
  this.password = await bcrypt.hash(this.password, rounds);
  next();
});

// ── Instance method: compare candidate password ───────────────────────────
userSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

// ── Remove password from JSON output ─────────────────────────────────────
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.emailVerificationOtp;
  delete obj.emailVerificationOtpExpires;
  delete obj.resetPasswordOtp;
  delete obj.resetPasswordOtpExpires;
  return obj;
};

const User: Model<IUser> = mongoose.model<IUser>('User', userSchema);

export default User;

import mongoose, { Model, Schema } from 'mongoose';
import { IChapter, IStory } from '../interfaces/story.interface';

const chapterSchema = new Schema<IChapter>(
  {
    chapterNumber: {
      type: Number,
      default: 1,
    },
    title: {
      type: String,
      required: [true, 'Chapter title is required'],
      trim: true,
      maxlength: [150, 'Chapter title cannot exceed 150 characters'],
    },
    summary: {
      type: String,
      trim: true,
      maxlength: [500, 'Chapter summary cannot exceed 500 characters'],
    },
    content: {
      type: String,
      required: [true, 'Chapter content is required'],
    },
    status: {
      type: String,
      enum: ['draft', 'published'],
      default: 'draft',
    },
    estimatedReadTime: {
      type: Number,
      default: 1,
    },
    hasAudioNarration: {
      type: Boolean,
      default: false,
    },
    audioUrl: {
      type: String,
      trim: true,
    },
    readsCount: {
      type: Number,
      default: 0,
    },
    likesCount: {
      type: Number,
      default: 0,
    },
    commentsCount: {
      type: Number,
      default: 0,
    },
    publishedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

const storySchema = new Schema<IStory>(
  {
    title: {
      type: String,
      required: [true, 'Story title is required'],
      trim: true,
      maxlength: [120, 'Title cannot exceed 120 characters'],
    },
    subtitle: {
      type: String,
      trim: true,
      maxlength: [150, 'Subtitle cannot exceed 150 characters'],
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    synopsis: {
      type: String,
      required: [true, 'Synopsis is required'],
      trim: true,
      maxlength: [2000, 'Synopsis cannot exceed 2000 characters'],
    },
    coverImage: {
      type: String,
      required: [true, 'Cover image is required'],
      default:
        'https://images.unsplash.com/photo-1518199266791-5375a83190b7?q=80&w=600&auto=format&fit=crop',
    },
    mainGenre: {
      type: String,
      required: [true, 'Main genre is required'],
      trim: true,
      index: true,
    },
    subGenres: {
      type: [String],
      default: [],
    },
    storyLanguage: {
      type: String,
      default: 'English',
      trim: true,
    },
    targetAudience: {
      type: String,
      default: 'All Ages',
      trim: true,
    },
    ageRating: {
      type: String,
      default: 'Everybody',
      trim: true,
    },
    triggerWarnings: {
      type: [String],
      default: [],
    },
    tradition: {
      type: String,
      default: 'Pan-African',
      trim: true,
    },
    difficulty: {
      type: String,
      enum: ['Beginner', 'Intermediate', 'Advanced'],
      default: 'Intermediate',
    },
    tags: {
      type: [String],
      default: [],
    },
    status: {
      type: String,
      enum: ['draft', 'ongoing', 'completed'],
      default: 'ongoing',
      index: true,
    },

    // Author metadata
    author: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Author ID is required'],
      index: true,
    },
    authorName: {
      type: String,
      required: [true, 'Author name is required'],
      trim: true,
    },
    authorPenName: {
      type: String,
      trim: true,
    },
    authorAvatar: {
      type: String,
      trim: true,
    },
    authorBio: {
      type: String,
      trim: true,
      maxlength: [500, 'Author bio cannot exceed 500 characters'],
    },

    // Chapters & stats
    chapters: {
      type: [chapterSchema],
      default: [],
    },
    totalChapters: {
      type: Number,
      default: 0,
    },
    estimatedReadTime: {
      type: Number,
      default: 0,
    },
    readsCount: {
      type: Number,
      default: 0,
    },
    likesCount: {
      type: Number,
      default: 0,
    },
    bookmarksCount: {
      type: Number,
      default: 0,
    },
    commentsCount: {
      type: Number,
      default: 0,
    },
    isInteractive: {
      type: Boolean,
      default: false,
    },
    hasAudioNarration: {
      type: Boolean,
      default: false,
    },
    publishedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

// ── Compound & Text Indexes ───────────────────────────────────────────────
storySchema.index({ title: 'text', synopsis: 'text', tags: 'text' });
storySchema.index({ mainGenre: 1, status: 1, createdAt: -1 });
storySchema.index({ author: 1, createdAt: -1 });

// ── Auto-Calculate Stats Hook ──────────────────────────────────────────────
storySchema.pre<IStory>('save', function (next) {
  if (this.chapters && this.chapters.length > 0) {
    this.totalChapters = this.chapters.length;

    // Calculate words / read time per chapter if not provided (assume 200 wpm)
    this.chapters.forEach((chap, idx) => {
      chap.chapterNumber = idx + 1;
      if (!chap.estimatedReadTime || chap.estimatedReadTime < 1) {
        const words = chap.content ? chap.content.trim().split(/\s+/).length : 0;
        chap.estimatedReadTime = Math.max(1, Math.ceil(words / 200));
      }
    });

    this.estimatedReadTime = this.chapters.reduce(
      (sum, chap) => sum + (chap.estimatedReadTime || 1),
      0
    );
    this.hasAudioNarration = this.chapters.some((c) => !!c.hasAudioNarration);
  } else {
    this.totalChapters = 0;
    this.estimatedReadTime = 0;
    this.hasAudioNarration = false;
  }

  if (this.status !== 'draft' && !this.publishedAt) {
    this.publishedAt = new Date();
  }

  next();
});

const Story: Model<IStory> = mongoose.model<IStory>('Story', storySchema);

export default Story;

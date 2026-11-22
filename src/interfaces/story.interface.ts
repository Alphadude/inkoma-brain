import { Document, Types } from 'mongoose';

export type StoryStatus = 'draft' | 'ongoing' | 'completed';
export type StoryDifficulty = 'Beginner' | 'Intermediate' | 'Advanced';
export type ChapterStatus = 'draft' | 'published';

export interface IChapter {
  _id?: Types.ObjectId;
  chapterNumber: number;
  title: string;
  summary?: string;
  content: string;
  status: ChapterStatus;
  estimatedReadTime: number; // in minutes
  hasAudioNarration?: boolean;
  audioUrl?: string;
  readsCount?: number;
  likesCount?: number;
  commentsCount?: number;
  publishedAt?: Date;
  updatedAt?: Date;
}

export interface IStory extends Document {
  title: string;
  subtitle?: string;
  slug: string;
  synopsis: string;
  coverImage: string;
  mainGenre: string;
  subGenres: string[];
  storyLanguage: string;
  targetAudience: string;
  ageRating: string;
  triggerWarnings: string[];
  tradition: string;
  difficulty: StoryDifficulty;
  tags: string[];
  status: StoryStatus;

  // Author details
  author: Types.ObjectId;
  authorName: string;
  authorPenName?: string;
  authorAvatar?: string;
  authorBio?: string;

  // Chapters & Metrics
  chapters: IChapter[];
  totalChapters: number;
  estimatedReadTime: number; // Cumulative in minutes
  readsCount: number;
  likesCount: number;
  bookmarksCount: number;
  commentsCount: number;
  isInteractive: boolean;
  hasAudioNarration: boolean;

  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateChapterInput {
  chapterNumber?: number;
  title: string;
  summary?: string;
  content: string;
  status?: ChapterStatus;
  estimatedReadTime?: number;
  hasAudioNarration?: boolean;
  audioUrl?: string;
}

export interface CreateStoryInput {
  title: string;
  subtitle?: string;
  synopsis: string;
  coverImage?: string;
  mainGenre: string;
  subGenres?: string[];
  storyLanguage?: string;
  targetAudience?: string;
  ageRating?: string;
  triggerWarnings?: string[];
  tradition?: string;
  difficulty?: StoryDifficulty;
  tags?: string[];
  status?: StoryStatus;
  authorPenName?: string;
  authorAvatar?: string;
  authorBio?: string;
  chapters?: CreateChapterInput[];
}

export interface UpdateStoryInput extends Partial<CreateStoryInput> {}

export interface StoryQueryParams {
  page?: number;
  limit?: number;
  mainGenre?: string;
  storyLanguage?: string;
  status?: StoryStatus;
  targetAudience?: string;
  author?: string;
  search?: string;
  sortBy?: 'newest' | 'popular' | 'readTime';
}

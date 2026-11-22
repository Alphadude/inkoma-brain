import { Types } from 'mongoose';
import Story from '../models/story.model';
import User from '../models/user.model';
import ApiError from '../utils/ApiError';
import {
  CreateStoryInput,
  UpdateStoryInput,
  StoryQueryParams,
  IStory,
} from '../interfaces/story.interface';

/**
 * Generates a URL-friendly unique slug from a title.
 */
const generateUniqueSlug = async (title: string, currentId?: string): Promise<string> => {
  const baseSlug = title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'untitled-story';

  let slug = baseSlug;
  let count = 1;

  while (true) {
    const existing = await Story.findOne({ slug });
    if (!existing || (currentId && existing._id.toString() === currentId)) {
      return slug;
    }
    slug = `${baseSlug}-${count++}`;
  }
};

/**
 * Creates a new story.
 */
export const createStory = async (
  userId: string,
  data: CreateStoryInput
): Promise<IStory> => {
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  const slug = await generateUniqueSlug(data.title);

  const defaultCover =
    'https://images.unsplash.com/photo-1518199266791-5375a83190b7?q=80&w=600&auto=format&fit=crop';

  const chapters = (data.chapters || []).map((ch, idx) => ({
    ...ch,
    chapterNumber: ch.chapterNumber || idx + 1,
    estimatedReadTime:
      ch.estimatedReadTime ||
      Math.max(1, Math.ceil((ch.content?.trim().split(/\s+/).length || 0) / 200)),
  }));

  const story = await Story.create({
    ...data,
    slug,
    coverImage: data.coverImage || defaultCover,
    author: user._id,
    authorName: user.name,
    authorPenName: data.authorPenName || user.name,
    authorAvatar: data.authorAvatar || undefined,
    authorBio: data.authorBio || undefined,
    chapters,
  });

  return story;
};

/**
 * Retrieves paginated list of stories with search and filters.
 */
export const getStories = async (
  params: StoryQueryParams
): Promise<{ stories: IStory[]; total: number; page: number; limit: number; totalPages: number }> => {
  const page = Number(params.page) || 1;
  const limit = Number(params.limit) || 12;
  const skip = (page - 1) * limit;

  const query: Record<string, any> = {};

  if (params.status) {
    query.status = params.status;
  } else {
    // By default, public feed only shows published stories (ongoing or completed)
    query.status = { $in: ['ongoing', 'completed'] };
  }

  if (params.mainGenre) {
    query.mainGenre = new RegExp(`^${params.mainGenre}$`, 'i');
  }

  if (params.storyLanguage) {
    query.storyLanguage = new RegExp(`^${params.storyLanguage}$`, 'i');
  }

  if (params.targetAudience) {
    query.targetAudience = params.targetAudience;
  }

  if (params.author) {
    if (Types.ObjectId.isValid(params.author)) {
      query.author = params.author;
    } else {
      query.authorName = new RegExp(params.author, 'i');
    }
  }

  if (params.search) {
    query.$text = { $search: params.search };
  }

  // Sorting
  let sort: Record<string, any> = { createdAt: -1 };
  if (params.sortBy === 'popular') {
    sort = { readsCount: -1, likesCount: -1, createdAt: -1 };
  } else if (params.sortBy === 'readTime') {
    sort = { estimatedReadTime: 1 };
  }

  const [stories, total] = await Promise.all([
    Story.find(query).sort(sort).skip(skip).limit(limit),
    Story.countDocuments(query),
  ]);

  return {
    stories,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit) || 1,
  };
};

/**
 * Retrieves a single story by its MongoDB ObjectId or unique slug.
 */
export const getStoryByIdOrSlug = async (
  idOrSlug: string,
  incrementRead: boolean = true
): Promise<IStory> => {
  const query = Types.ObjectId.isValid(idOrSlug)
    ? { _id: idOrSlug }
    : { slug: idOrSlug.toLowerCase() };

  const story = await Story.findOne(query);
  if (!story) {
    throw new ApiError(404, 'Story not found');
  }

  if (incrementRead) {
    story.readsCount = (story.readsCount || 0) + 1;
    await story.save({ validateBeforeSave: false });
  }

  return story;
};

/**
 * Updates an existing story. Only author or admin can update.
 */
export const updateStory = async (
  storyId: string,
  userId: string,
  userRole: string,
  data: UpdateStoryInput
): Promise<IStory> => {
  const story = await Story.findById(storyId);
  if (!story) {
    throw new ApiError(404, 'Story not found');
  }

  if (story.author.toString() !== userId && userRole !== 'admin') {
    throw new ApiError(403, 'You do not have permission to modify this story');
  }

  // If title changed, update slug
  if (data.title && data.title !== story.title) {
    story.slug = await generateUniqueSlug(data.title, story._id.toString());
  }

  if (data.chapters) {
    data.chapters = data.chapters.map((ch, idx) => ({
      ...ch,
      chapterNumber: ch.chapterNumber || idx + 1,
      estimatedReadTime:
        ch.estimatedReadTime ||
        Math.max(1, Math.ceil((ch.content?.trim().split(/\s+/).length || 0) / 200)),
    }));
  }

  Object.assign(story, data);
  await story.save();

  return story;
};

/**
 * Deletes a story. Only author or admin can delete.
 */
export const deleteStory = async (
  storyId: string,
  userId: string,
  userRole: string
): Promise<void> => {
  const story = await Story.findById(storyId);
  if (!story) {
    throw new ApiError(404, 'Story not found');
  }

  if (story.author.toString() !== userId && userRole !== 'admin') {
    throw new ApiError(403, 'You do not have permission to delete this story');
  }

  await Story.deleteOne({ _id: story._id });
};

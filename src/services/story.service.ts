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
    if (params.status === 'published') {
      query.status = { $in: ['ongoing', 'completed'] };
    } else {
      query.status = params.status;
    }
  } else {
    // By default, public feed only shows published stories (ongoing or completed)
    query.status = { $in: ['ongoing', 'completed'] };
  }

  const genreFilter = params.genre || params.mainGenre;
  if (genreFilter && genreFilter !== 'all') {
    query.$or = [
      { mainGenre: new RegExp(`^${genreFilter}$`, 'i') },
      { subGenres: new RegExp(`^${genreFilter}$`, 'i') },
    ];
  }

  if (params.tradition) {
    query.tradition = new RegExp(`^${params.tradition}$`, 'i');
  }

  if (params.audio === true || params.hasAudio === true) {
    query.hasAudioNarration = true;
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
      const authorUser = await User.findOne({ username: params.author.toLowerCase() });
      if (authorUser) {
        query.author = authorUser._id;
      } else {
        query.$or = [
          { authorName: new RegExp(params.author, 'i') },
          { authorPenName: new RegExp(params.author, 'i') },
        ];
      }
    }
  }

  if (params.search) {
    query.$text = { $search: params.search };
  }

  // Sorting
  let sort: Record<string, any> = { createdAt: -1 };
  if (params.sortBy === 'trending') {
    sort = { readsCount: -1, likesCount: -1, updatedAt: -1 };
  } else if (params.sortBy === 'most_read' || params.sortBy === 'popular') {
    sort = { readsCount: -1, likesCount: -1, createdAt: -1 };
  } else if (params.sortBy === 'most_liked') {
    sort = { likesCount: -1, readsCount: -1, createdAt: -1 };
  } else if (params.sortBy === 'highest_rated') {
    sort = { likesCount: -1, readsCount: -1 };
  } else if (params.sortBy === 'newest') {
    sort = { createdAt: -1 };
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

/**
 * Retrieves top trending stories for the explore carousel.
 */
export const getTrendingStories = async (limit: number = 10): Promise<any[]> => {
  const stories = await Story.find({ status: { $in: ['ongoing', 'completed'] } })
    .sort({ readsCount: -1, likesCount: -1, updatedAt: -1 })
    .limit(limit);

  return stories.map((s, idx) => ({
    ...s.toObject(),
    rank: idx + 1,
    rating: 5.0,
  }));
};

/**
 * Retrieves highest rated stories for explore section.
 */
export const getHighestRatedStories = async (limit: number = 10): Promise<any[]> => {
  const stories = await Story.find({ status: { $in: ['ongoing', 'completed'] } })
    .sort({ likesCount: -1, readsCount: -1 })
    .limit(limit);

  return stories.map((s, idx) => ({
    ...s.toObject(),
    rank: idx + 1,
    rating: 5.0,
  }));
};

/**
 * Retrieves folklore traditions metadata and live manuscript counts.
 */
export const getTraditionsWithCounts = async (): Promise<any[]> => {
  const counts = await Story.aggregate([
    { $match: { status: { $in: ['ongoing', 'completed'] } } },
    { $group: { _id: '$tradition', count: { $sum: 1 } } },
  ]);

  const countMap = new Map<string, number>();
  for (const c of counts) {
    if (c._id) {
      countMap.set(String(c._id).toLowerCase(), c.count);
    }
  }

  const catalogue = [
    {
      id: 'ashanti-akan',
      name: 'Ashanti & Akan Lore',
      tradition: 'Ashanti/Akan',
      description: 'Anansi trickster wisdom & golden stool covenants',
      image:
        'https://images.unsplash.com/photo-1544717305-2782549b5136?w=600&auto=format&fit=crop&q=80',
      href: '/explore?tradition=Ashanti%2FAkan',
      badge: 'Trickster Wisdom',
    },
    {
      id: 'yoruba-orisha',
      name: 'Yoruba Orisha Mythos',
      tradition: 'Yoruba',
      description: 'Thunder deities, sea spirits, and ancestral pacts',
      image:
        'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80',
      href: '/explore?tradition=Yoruba',
      badge: 'Spirit Realm',
    },
    {
      id: 'dogon-cosmology',
      name: 'Dogon Star Cosmology',
      tradition: 'Dogon',
      description: 'Sirius star dancers & ancient cliff cosmology',
      image:
        'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?w=600&auto=format&fit=crop&q=80',
      href: '/explore?tradition=Dogon',
      badge: 'Star Myths',
    },
    {
      id: 'mandinka-mali',
      name: 'Manden Heroic Epics',
      tradition: 'Pan-African',
      description: 'Sundiata Keita, griot recitations, and iron staffs',
      image:
        'https://images.unsplash.com/photo-1509099836639-18ba1795216d?w=600&auto=format&fit=crop&q=80',
      href: '/explore?genre=Historical%20Epics',
      badge: 'Royal Dynasties',
    },
    {
      id: 'zulu-southern',
      name: 'Zulu & Southern Epics',
      tradition: 'Zulu',
      description: 'Izibongo praise poetry & warrior lineage quests',
      image:
        'https://images.unsplash.com/photo-1516483638261-f4dbaf036963?w=600&auto=format&fit=crop&q=80',
      href: '/explore?tradition=Zulu',
      badge: 'Warrior Lineage',
    },
    {
      id: 'swahili-coastal',
      name: 'Swahili Coastal Tales',
      tradition: 'Swahili',
      description: 'Indian Ocean trade winds, sea djinns & dhows',
      image:
        'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&auto=format&fit=crop&q=80',
      href: '/explore?tradition=Swahili',
      badge: 'Coastal Legends',
    },
    {
      id: 'afrofuturism',
      name: 'Afrofuturism & Cyber Lore',
      tradition: 'Pan-African',
      description: 'Futuristic solar kingdoms & cybernetic mythos',
      image:
        'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&auto=format&fit=crop&q=80',
      href: '/explore?genre=Afrofuturism',
      badge: 'Futuristic Mythos',
    },
    {
      id: 'dominican-republic',
      name: 'Dominican & Taíno Lore',
      tradition: 'Dominican Republic',
      description: 'La Ciguapa, Cordillera mist & Quisqueya Taíno legends',
      image:
        'https://images.unsplash.com/photo-1511497584788-876761c119ef?w=600&auto=format&fit=crop&q=80',
      href: '/explore?tradition=Dominican%20Republic',
      badge: 'Caribbean Legends',
    },
  ];

  return catalogue.map((item) => {
    const liveCount =
      countMap.get(item.tradition.toLowerCase()) ||
      countMap.get(item.id.toLowerCase()) ||
      0;
    return {
      ...item,
      count: liveCount,
    };
  });
};

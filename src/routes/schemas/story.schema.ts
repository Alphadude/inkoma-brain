import Joi from 'joi';

const chapterInputSchema = Joi.object({
  chapterNumber: Joi.number().integer().min(1).optional(),
  title: Joi.string().trim().min(1).max(150).required(),
  summary: Joi.string().trim().max(500).allow('').optional(),
  content: Joi.string().trim().min(1).required(),
  status: Joi.string().valid('draft', 'published').default('draft'),
  estimatedReadTime: Joi.number().min(1).optional(),
  hasAudioNarration: Joi.boolean().default(false),
  audioUrl: Joi.string().uri().allow('').optional(),
});

export const createStorySchema = Joi.object({
  title: Joi.string().trim().min(1).max(120).required(),
  subtitle: Joi.string().trim().max(150).allow('').optional(),
  synopsis: Joi.string().trim().min(1).max(2000).required(),
  coverImage: Joi.string().trim().uri().allow('').optional(),
  mainGenre: Joi.string().trim().min(2).max(50).required(),
  subGenres: Joi.array().items(Joi.string().trim()).default([]),
  storyLanguage: Joi.string().trim().default('English'),
  targetAudience: Joi.string().trim().default('All Ages'),
  ageRating: Joi.string().trim().default('Everybody'),
  triggerWarnings: Joi.array().items(Joi.string().trim()).default([]),
  tradition: Joi.string().trim().default('Pan-African'),
  difficulty: Joi.string().valid('Beginner', 'Intermediate', 'Advanced').default('Intermediate'),
  tags: Joi.array().items(Joi.string().trim()).default([]),
  status: Joi.string().valid('draft', 'ongoing', 'completed').default('ongoing'),
  authorPenName: Joi.string().trim().max(100).allow('').optional(),
  authorAvatar: Joi.string().trim().uri().allow('').optional(),
  authorBio: Joi.string().trim().max(500).allow('').optional(),
  chapters: Joi.array().items(chapterInputSchema).default([]),
});

export const updateStorySchema = Joi.object({
  title: Joi.string().trim().min(1).max(120).optional(),
  subtitle: Joi.string().trim().max(150).allow('').optional(),
  synopsis: Joi.string().trim().min(1).max(2000).optional(),
  coverImage: Joi.string().trim().uri().allow('').optional(),
  mainGenre: Joi.string().trim().min(2).max(50).optional(),
  subGenres: Joi.array().items(Joi.string().trim()).optional(),
  storyLanguage: Joi.string().trim().optional(),
  targetAudience: Joi.string().trim().optional(),
  ageRating: Joi.string().trim().optional(),
  triggerWarnings: Joi.array().items(Joi.string().trim()).optional(),
  tradition: Joi.string().trim().optional(),
  difficulty: Joi.string().valid('Beginner', 'Intermediate', 'Advanced').optional(),
  tags: Joi.array().items(Joi.string().trim()).optional(),
  status: Joi.string().valid('draft', 'ongoing', 'completed').optional(),
  authorPenName: Joi.string().trim().max(100).allow('').optional(),
  authorAvatar: Joi.string().trim().uri().allow('').optional(),
  authorBio: Joi.string().trim().max(500).allow('').optional(),
  chapters: Joi.array().items(chapterInputSchema).optional(),
}).min(1);

export const storyQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(12),
  mainGenre: Joi.string().trim().optional(),
  genre: Joi.string().trim().optional(),
  tradition: Joi.string().trim().optional(),
  audio: Joi.boolean().optional(),
  hasAudio: Joi.boolean().optional(),
  storyLanguage: Joi.string().trim().optional(),
  status: Joi.string().valid('draft', 'ongoing', 'completed', 'published').optional(),
  targetAudience: Joi.string().trim().optional(),
  author: Joi.string().trim().optional(),
  search: Joi.string().trim().allow('').optional(),
  sortBy: Joi.string()
    .valid('trending', 'newest', 'most_read', 'most_liked', 'highest_rated', 'popular', 'readTime')
    .default('trending'),
});

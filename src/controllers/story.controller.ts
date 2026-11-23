import { Request, Response } from 'express';
import * as storyService from '../services/story.service';
import asyncHandler from '../utils/asyncHandler';
import ApiResponse from '../utils/ApiResponse';
import ApiError from '../utils/ApiError';
import { uploadBufferToCloudinary } from '../config/cloudinary';

/**
 * POST /api/v1/stories
 * Create a new story (draft or published).
 */
export const createStory = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const story = await storyService.createStory(req.user!._id.toString(), req.body);
  res.status(201).json(new ApiResponse(201, { story }, 'Story created successfully'));
});

/**
 * GET /api/v1/stories
 * Get list of stories with filtering, search, and pagination.
 */
export const getStories = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const result = await storyService.getStories(req.query);
  res.status(200).json(new ApiResponse(200, result, 'Stories fetched successfully'));
});

/**
 * GET /api/v1/stories/:idOrSlug
 * Get single story by MongoDB ObjectId or unique slug.
 */
export const getStoryByIdOrSlug = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const story = await storyService.getStoryByIdOrSlug(req.params['idOrSlug']!);
  res.status(200).json(new ApiResponse(200, { story }, 'Story retrieved successfully'));
});

/**
 * PUT /api/v1/stories/:id
 * Update an existing story.
 */
export const updateStory = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const story = await storyService.updateStory(
    req.params['id']!,
    req.user!._id.toString(),
    req.user!.role,
    req.body
  );
  res.status(200).json(new ApiResponse(200, { story }, 'Story updated successfully'));
});

/**
 * DELETE /api/v1/stories/:id
 * Delete a story.
 */
export const deleteStory = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  await storyService.deleteStory(req.params['id']!, req.user!._id.toString(), req.user!.role);
  res.status(200).json(new ApiResponse(200, null, 'Story deleted successfully'));
});

/**
 * POST /api/v1/stories/cover
 * Upload cover image to Cloudinary.
 */
export const uploadCoverImage = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.file) {
    throw new ApiError(400, 'No image file uploaded');
  }

  const uploadRes = await uploadBufferToCloudinary(req.file.buffer, 'inkoma_covers');
  res.status(200).json(
    new ApiResponse(
      200,
      {
        url: uploadRes.secure_url,
        publicId: uploadRes.public_id,
      },
      'Cover image uploaded successfully'
    )
  );
});

/**
 * GET /api/v1/stories/trending
 * Get top 10 trending stories for explore carousel.
 */
export const getTrendingStories = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
  const stories = await storyService.getTrendingStories(10);
  res.status(200).json(new ApiResponse(200, { stories }, 'Trending stories fetched successfully'));
});

/**
 * GET /api/v1/stories/highest-rated
 * Get top 10 highest-rated stories for explore section.
 */
export const getHighestRatedStories = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
  const stories = await storyService.getHighestRatedStories(10);
  res.status(200).json(new ApiResponse(200, { stories }, 'Highest rated stories fetched successfully'));
});

/**
 * GET /api/v1/stories/traditions
 * Get folklore traditions metadata with dynamic manuscript counts.
 */
export const getTraditions = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
  const traditions = await storyService.getTraditionsWithCounts();
  res.status(200).json(new ApiResponse(200, { traditions }, 'Traditions fetched successfully'));
});

/**
 * GET /api/v1/stories/feed/home
 * Get curated home page landing feed.
 */
export const getHomeFeed = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
  const feed = await storyService.getHomeFeed();
  res.status(200).json(new ApiResponse(200, feed, 'Home feed fetched successfully'));
});

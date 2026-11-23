import { Request, Response } from 'express';
import asyncHandler from '../utils/asyncHandler';
import ApiResponse from '../utils/ApiResponse';
import * as discussionService from '../services/discussion.service';

/**
 * GET /api/v1/community/discussions
 * List discussions with filters (Public with optional Auth).
 */
export const getDiscussions = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const currentUserId = req.user?._id?.toString();
  const { tradition, search, sortBy, page, limit } = req.query;
  const result = await discussionService.getDiscussions(
    {
      tradition: tradition ? String(tradition) : undefined,
      search: search ? String(search) : undefined,
      sortBy: sortBy === 'popular' ? 'popular' : 'recent',
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    },
    currentUserId
  );

  res.status(200).json(new ApiResponse(200, result, 'Discussions fetched successfully'));
});

/**
 * GET /api/v1/community/discussions/:id
 * Get single discussion thread with replies (Public with optional Auth).
 */
export const getDiscussionById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const currentUserId = req.user?._id?.toString();
  const discussion = await discussionService.getDiscussionById(req.params['id']!, currentUserId);
  res.status(200).json(new ApiResponse(200, { discussion }, 'Discussion fetched successfully'));
});

/**
 * POST /api/v1/community/discussions
 * Create a new discussion thread (Protected).
 */
export const createDiscussion = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const discussion = await discussionService.createDiscussion(
    req.user!._id.toString(),
    req.body
  );

  res.status(201).json(new ApiResponse(201, { discussion }, 'Discussion created successfully'));
});

/**
 * POST /api/v1/community/discussions/:id/replies
 * Add a reply to a discussion (Protected).
 */
export const addReply = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const reply = await discussionService.addReply(
    req.user!._id.toString(),
    req.params['id']!,
    req.body.content
  );

  res.status(201).json(new ApiResponse(201, { reply }, 'Reply posted successfully'));
});

/**
 * POST /api/v1/community/discussions/:id/like
 * Toggle like on a discussion (Protected).
 */
export const likeDiscussion = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const result = await discussionService.likeDiscussion(
    req.user!._id.toString(),
    req.params['id']!
  );

  res.status(200).json(new ApiResponse(200, result, 'Discussion like updated'));
});

/**
 * DELETE /api/v1/community/discussions/:id
 * Delete a discussion thread (Protected: author only).
 */
export const deleteDiscussion = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  await discussionService.deleteDiscussion(
    req.user!._id.toString(),
    req.params['id']!
  );

  res.status(200).json(new ApiResponse(200, null, 'Discussion deleted successfully'));
});

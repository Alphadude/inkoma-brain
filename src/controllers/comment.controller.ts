import { Request, Response } from 'express';
import asyncHandler from '../utils/asyncHandler';
import ApiResponse from '../utils/ApiResponse';
import * as commentService from '../services/comment.service';

/**
 * GET /api/v1/stories/:storyId/comments
 * Fetch comments for a story (or specific chapter).
 */
export const getComments = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const currentUserId = req.user?._id?.toString();
  const { chapterNumber, page, limit } = req.query;
  const result = await commentService.getComments(
    req.params['storyId']!,
    {
      chapterNumber: chapterNumber !== undefined ? Number(chapterNumber) : undefined,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    },
    currentUserId
  );

  res.status(200).json(new ApiResponse(200, result, 'Comments fetched successfully'));
});

/**
 * POST /api/v1/stories/:storyId/comments
 * Post a new comment or reply (Protected).
 */
export const createComment = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const comment = await commentService.createComment(
    req.user!._id.toString(),
    req.params['storyId']!,
    req.body
  );

  res.status(201).json(new ApiResponse(201, { comment }, 'Comment created successfully'));
});

/**
 * POST /api/v1/stories/comments/:commentId/like
 * Toggle like on a comment (Protected).
 */
export const likeComment = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const result = await commentService.likeComment(
    req.user!._id.toString(),
    req.params['commentId']!
  );

  res.status(200).json(new ApiResponse(200, result, 'Comment like updated'));
});

/**
 * DELETE /api/v1/stories/comments/:commentId
 * Delete a comment (Protected: author only).
 */
export const deleteComment = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  await commentService.deleteComment(
    req.user!._id.toString(),
    req.params['commentId']!
  );

  res.status(200).json(new ApiResponse(200, null, 'Comment deleted successfully'));
});

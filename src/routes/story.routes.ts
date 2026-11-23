import { Router } from 'express';
import * as storyController from '../controllers/story.controller';
import * as commentController from '../controllers/comment.controller';
import { protect, optionalAuth } from '../middlewares/auth.middleware';
import validate from '../middlewares/validate.middleware';
import upload, { uploadPdf } from '../middlewares/upload.middleware';
import {
  createStorySchema,
  updateStorySchema,
  storyQuerySchema,
} from './schemas/story.schema';
import { createCommentSchema } from './schemas/comment.schema';

const router = Router();

/**
 * @route   GET  /api/v1/stories         — List stories (Public with filters & pagination)
 * @route   POST /api/v1/stories         — Create story (Protected)
 */
router
  .route('/')
  .get(validate(storyQuerySchema, 'query'), storyController.getStories)
  .post(protect, validate(createStorySchema), storyController.createStory);

/**
 * @route   GET /api/v1/stories/feed/home      — Get curated home landing feed (Public or Personalized with Token)
 * @route   GET /api/v1/stories/trending       — Get top 10 trending stories (Public)
 * @route   GET /api/v1/stories/highest-rated  — Get top 10 highest-rated stories (Public)
 * @route   GET /api/v1/stories/traditions     — Get traditions catalogue with counts (Public)
 */
router.get('/feed/home', optionalAuth, storyController.getHomeFeed);
router.get('/trending', storyController.getTrendingStories);
router.get('/highest-rated', storyController.getHighestRatedStories);
router.get('/traditions', storyController.getTraditions);

/**
 * @route   POST /api/v1/stories/cover   — Upload cover image to Cloudinary (Protected)
 */
router.post(
  '/cover',
  protect,
  upload.single('coverImage'),
  storyController.uploadCoverImage
);

/**
 * PDF Manuscript Upload & Extraction Endpoints
 * @route   POST /api/v1/stories/parse-pdf   — Extract & segment chapters from PDF (Protected)
 * @route   POST /api/v1/stories/import-pdf  — Extract & create draft story from PDF (Protected)
 */
router.post(
  '/parse-pdf',
  protect,
  uploadPdf.single('file'),
  storyController.parsePdfManuscript
);
router.post(
  '/import-pdf',
  protect,
  uploadPdf.single('file'),
  storyController.importPdfManuscript
);


/**
 * Story Comments Endpoints
 * @route   GET    /api/v1/stories/:storyId/comments       — Get comments for a story (Public)
 * @route   POST   /api/v1/stories/:storyId/comments       — Post comment or reply (Protected)
 * @route   POST   /api/v1/stories/comments/:commentId/like— Like/unlike comment (Protected)
 * @route   DELETE /api/v1/stories/comments/:commentId     — Delete comment (Protected)
 */
router.get('/:storyId/comments', optionalAuth, commentController.getComments);
router.post('/:storyId/comments', protect, validate(createCommentSchema), commentController.createComment);
router.post('/comments/:commentId/like', protect, commentController.likeComment);
router.delete('/comments/:commentId', protect, commentController.deleteComment);

/**
 * @route   GET    /api/v1/stories/:idOrSlug — Get single story by ID or Slug (Public)
 * @route   PUT    /api/v1/stories/:id       — Update story (Protected: Author or Admin)
 * @route   DELETE /api/v1/stories/:id       — Delete story (Protected: Author or Admin)
 */
router.get('/:idOrSlug', storyController.getStoryByIdOrSlug);

router
  .route('/:id')
  .put(protect, validate(updateStorySchema), storyController.updateStory)
  .delete(protect, storyController.deleteStory);

export default router;

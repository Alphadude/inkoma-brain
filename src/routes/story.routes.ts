import { Router } from 'express';
import * as storyController from '../controllers/story.controller';
import { protect } from '../middlewares/auth.middleware';
import validate from '../middlewares/validate.middleware';
import upload from '../middlewares/upload.middleware';
import {
  createStorySchema,
  updateStorySchema,
  storyQuerySchema,
} from './schemas/story.schema';

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
 * @route   POST /api/v1/stories/cover   — Upload cover image to Cloudinary (Protected)
 */
router.post(
  '/cover',
  protect,
  upload.single('coverImage'),
  storyController.uploadCoverImage
);

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

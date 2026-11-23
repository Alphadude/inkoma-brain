import { Router } from 'express';
import * as discussionController from '../controllers/discussion.controller';
import { protect, optionalAuth } from '../middlewares/auth.middleware';
import validate from '../middlewares/validate.middleware';
import { createDiscussionSchema, addReplySchema } from './schemas/discussion.schema';

const router = Router();

/**
 * @route   GET    /api/v1/community/discussions     — List discussions (Public with optional Auth)
 * @route   GET    /api/v1/community/discussions/:id — Get discussion with replies (Public with optional Auth)
 */
router.get('/discussions', optionalAuth, discussionController.getDiscussions);
router.get('/discussions/:id', optionalAuth, discussionController.getDiscussionById);

/**
 * Protected routes
 */
router.post('/discussions', protect, validate(createDiscussionSchema), discussionController.createDiscussion);
router.post('/discussions/:id/replies', protect, validate(addReplySchema), discussionController.addReply);
router.post('/discussions/:id/like', protect, discussionController.likeDiscussion);
router.delete('/discussions/:id', protect, discussionController.deleteDiscussion);

export default router;

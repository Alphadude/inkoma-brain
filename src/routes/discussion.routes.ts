import { Router } from 'express';
import * as discussionController from '../controllers/discussion.controller';
import { protect } from '../middlewares/auth.middleware';

const router = Router();

/**
 * @route   GET    /api/v1/community/discussions     — List discussions (Public with optional Auth)
 * @route   GET    /api/v1/community/discussions/:id — Get discussion with replies (Public with optional Auth)
 */
router.get('/discussions', discussionController.getDiscussions);
router.get('/discussions/:id', discussionController.getDiscussionById);

/**
 * Protected routes
 */
router.post('/discussions', protect, discussionController.createDiscussion);
router.post('/discussions/:id/replies', protect, discussionController.addReply);
router.post('/discussions/:id/like', protect, discussionController.likeDiscussion);
router.delete('/discussions/:id', protect, discussionController.deleteDiscussion);

export default router;

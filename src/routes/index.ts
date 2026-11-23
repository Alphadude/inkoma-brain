import { Router } from 'express';
import authRoutes from './auth.routes';
import itemRoutes from './item.routes';
import storyRoutes from './story.routes';
import userRoutes from './user.routes';
import notificationRoutes from './notification.routes';
import discussionRoutes from './discussion.routes';
import supportRoutes from './support.routes';
import helpRoutes from './help.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/items', itemRoutes);
router.use('/stories', storyRoutes);
router.use('/users', userRoutes);
router.use('/notifications', notificationRoutes);
router.use('/community', discussionRoutes);
router.use('/support', supportRoutes);
router.use('/donations', supportRoutes);
router.use('/help', helpRoutes);

export default router;

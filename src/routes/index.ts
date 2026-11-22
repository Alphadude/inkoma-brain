import { Router } from 'express';
import authRoutes from './auth.routes';
import itemRoutes from './item.routes';
import storyRoutes from './story.routes';
import userRoutes from './user.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/items', itemRoutes);
router.use('/stories', storyRoutes);
router.use('/users', userRoutes);

export default router;

import { Router } from 'express';
import authRoutes from './auth.routes';
import itemRoutes from './item.routes';
import storyRoutes from './story.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/items', itemRoutes);
router.use('/stories', storyRoutes);

// Add new resources here:
// router.use('/users', userRoutes);
// router.use('/orders', orderRoutes);

export default router;

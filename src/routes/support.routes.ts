import { Router } from 'express';
import * as supportController from '../controllers/support.controller';
import { protect, optionalAuth } from '../middlewares/auth.middleware';
import validate from '../middlewares/validate.middleware';
import { initializeDonationSchema } from './schemas/support.schema';

const router = Router();

/**
 * Public support & donation endpoints
 */
router.get('/platform-info', supportController.getPlatformInfo);
router.post('/donations/initialize', optionalAuth, validate(initializeDonationSchema), supportController.initializeDonation);
router.post('/donations/verify/:reference', supportController.verifyDonation);

/**
 * Protected user donation history
 */
router.get('/donations/my', protect, supportController.getMyDonations);

export default router;

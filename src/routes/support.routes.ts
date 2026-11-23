import { Router } from 'express';
import * as supportController from '../controllers/support.controller';
import { protect } from '../middlewares/auth.middleware';

const router = Router();

/**
 * Public support & donation endpoints
 */
router.get('/platform-info', supportController.getPlatformInfo);
router.post('/donations/initialize', supportController.initializeDonation);
router.post('/donations/verify/:reference', supportController.verifyDonation);

/**
 * Protected user donation history
 */
router.get('/donations/my', protect, supportController.getMyDonations);

export default router;

import { Router } from 'express';
import * as helpController from '../controllers/help.controller';
import { protect } from '../middlewares/auth.middleware';

const router = Router();

/**
 * Public help & ticket endpoints
 */
router.get('/faqs', helpController.getFaqs);
router.post('/tickets', helpController.createTicket);

/**
 * Protected user tickets
 */
router.get('/tickets/my', protect, helpController.getMyTickets);

export default router;

import { Router } from 'express';
import * as helpController from '../controllers/help.controller';
import { protect, optionalAuth } from '../middlewares/auth.middleware';
import validate from '../middlewares/validate.middleware';
import { createTicketSchema } from './schemas/help.schema';

const router = Router();

/**
 * Public help & ticket endpoints
 */
router.get('/faqs', helpController.getFaqs);
router.post('/tickets', optionalAuth, validate(createTicketSchema), helpController.createTicket);

/**
 * Protected user tickets
 */
router.get('/tickets/my', protect, helpController.getMyTickets);

export default router;

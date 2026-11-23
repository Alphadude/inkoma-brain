import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import asyncHandler from '../utils/asyncHandler';
import ApiResponse from '../utils/ApiResponse';
import * as helpService from '../services/help.service';

/**
 * GET /api/v1/help/faqs
 * Get categorized FAQs for Help Center (Public).
 */
export const getFaqs = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
  const faqs = await helpService.getFaqs();
  res.status(200).json(new ApiResponse(200, { faqs }, 'FAQs fetched successfully'));
});

/**
 * POST /api/v1/help/tickets
 * Submit a support ticket or inquiry (Public or Protected).
 */
export const createTicket = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  let userId: string | undefined;
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const token = authHeader.split(' ')[1];
      const decoded: any = jwt.verify(token, process.env.JWT_SECRET as string);
      userId = decoded?.id;
    } catch {
      // Soft ignore
    }
  }

  const result = await helpService.createTicket(userId, req.body);
  res.status(201).json(new ApiResponse(201, result, 'Support ticket submitted successfully'));
});

/**
 * GET /api/v1/help/tickets/my
 * Get tickets submitted by current user (Protected).
 */
export const getMyTickets = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const tickets = await helpService.getUserTickets(req.user!._id.toString());
  res.status(200).json(new ApiResponse(200, { tickets }, 'User tickets fetched successfully'));
});

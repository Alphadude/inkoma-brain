import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import asyncHandler from '../utils/asyncHandler';
import ApiResponse from '../utils/ApiResponse';
import * as supportService from '../services/support.service';

/**
 * GET /api/v1/support/platform-info
 * Returns platform bank accounts, crypto wallets, and patron tiers (Public).
 */
export const getPlatformInfo = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
  const info = await supportService.getPlatformSupportInfo();
  res.status(200).json(new ApiResponse(200, info, 'Platform support info fetched successfully'));
});

/**
 * POST /api/v1/support/donations/initialize
 * Initializes a donation with Paystack (Public or Protected).
 */
export const initializeDonation = asyncHandler(async (req: Request, res: Response): Promise<void> => {
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

  const result = await supportService.initializeDonation(userId, req.body);
  res.status(201).json(new ApiResponse(201, result, 'Donation initialized successfully'));
});

/**
 * POST /api/v1/support/donations/verify/:reference
 * Verifies Paystack donation reference (Public).
 */
export const verifyDonation = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const result = await supportService.verifyDonation(req.params['reference']!);
  res.status(200).json(new ApiResponse(200, result, 'Donation verified successfully'));
});

/**
 * GET /api/v1/support/donations/my
 * Get current user donation history (Protected).
 */
export const getMyDonations = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const donations = await supportService.getUserDonations(req.user!._id.toString());
  res.status(200).json(new ApiResponse(200, { donations }, 'User donations fetched successfully'));
});

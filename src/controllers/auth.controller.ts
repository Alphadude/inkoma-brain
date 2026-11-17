import { Request, Response } from 'express';
import * as authService from '../services/auth.service';
import asyncHandler from '../utils/asyncHandler';
import ApiResponse from '../utils/ApiResponse';

/**
 * POST /api/v1/auth/register
 */
export const register = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const result = await authService.register(req.body);
  res.status(201).json(new ApiResponse(201, result, result.message));
});

/**
 * POST /api/v1/auth/verify-email
 */
export const verifyEmail = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const result = await authService.verifyEmail(req.body);
  res.status(200).json(new ApiResponse(200, result, 'Email verified successfully'));
});

/**
 * POST /api/v1/auth/resend-verification-otp
 */
export const resendVerificationOtp = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const result = await authService.resendVerificationOtp(req.body);
  res.status(200).json(new ApiResponse(200, result, result.message));
});

/**
 * POST /api/v1/auth/login
 */
export const login = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { user, token } = await authService.login(req.body);
  res.status(200).json(new ApiResponse(200, { user, token }, 'Logged in successfully'));
});

/**
 * POST /api/v1/auth/forgot-password
 */
export const forgotPassword = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const result = await authService.forgotPassword(req.body);
  res.status(200).json(new ApiResponse(200, result, result.message));
});

/**
 * POST /api/v1/auth/reset-password
 */
export const resetPassword = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const result = await authService.resetPassword(req.body);
  res.status(200).json(new ApiResponse(200, result, result.message));
});

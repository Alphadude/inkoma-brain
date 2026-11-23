import { IUser } from './user.interface';

export interface RegisterInput {
  name: string;
  email: string;
  phone?: string;
  password: string;
  preferredCategories?: string[];
  category?: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface ForgotPasswordInput {
  email?: string;
  phone?: string;
}

export interface ResetPasswordInput {
  email?: string;
  phone?: string;
  otp: string;
  newPassword: string;
}

export interface VerifyEmailInput {
  email: string;
  otp: string;
}

export interface ResendOtpInput {
  email: string;
}

export interface RegisterResult {
  user: IUser;
  message: string;
}

export interface AuthResult {
  user: IUser;
  token: string;
}

export interface JwtPayload {
  id: string;
  iat: number;
  exp: number;
}

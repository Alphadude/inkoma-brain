import { Document } from 'mongoose';

export type UserRole = 'user' | 'admin';

export interface IUser extends Document {
  name: string;
  email: string;
  phone?: string;
  password: string;
  role: UserRole;
  isEmailVerified: boolean;
  emailVerificationOtp?: string;
  emailVerificationOtpExpires?: Date;
  resetPasswordOtp?: string;
  resetPasswordOtpExpires?: Date;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

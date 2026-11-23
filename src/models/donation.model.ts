import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IDonation extends Document {
  donor?: Types.ObjectId;
  donorName: string;
  donorEmail: string;
  amount: number;
  currency: string;
  paymentMethod: 'paystack' | 'bank_transfer' | 'crypto';
  reference: string;
  status: 'pending' | 'success' | 'failed';
  targetType: 'platform' | 'author';
  author?: Types.ObjectId;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const donationSchema = new Schema<IDonation>(
  {
    donor: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    donorName: {
      type: String,
      required: true,
      trim: true,
    },
    donorEmail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    amount: {
      type: Number,
      required: true,
      min: [1, 'Amount must be at least 1'],
    },
    currency: {
      type: String,
      default: 'NGN',
      uppercase: true,
    },
    paymentMethod: {
      type: String,
      enum: ['paystack', 'bank_transfer', 'crypto'],
      default: 'paystack',
    },
    reference: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['pending', 'success', 'failed'],
      default: 'pending',
      index: true,
    },
    targetType: {
      type: String,
      enum: ['platform', 'author'],
      default: 'platform',
    },
    author: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    metadata: {
      type: Schema.Types.Mixed,
    },
  },
  { timestamps: true }
);

const Donation = mongoose.model<IDonation>('Donation', donationSchema);
export default Donation;

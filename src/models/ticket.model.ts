import mongoose, { Document, Schema, Types } from 'mongoose';

export type TicketCategory =
  | 'General'
  | 'Storyteller Support'
  | 'Billing & Patronage'
  | 'Technical Bug'
  | 'Lore Preservation';

export type TicketPriority = 'low' | 'normal' | 'high';
export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed';

export interface ISupportTicket extends Document {
  ticketNumber: string;
  user?: Types.ObjectId;
  name: string;
  email: string;
  category: TicketCategory;
  subject: string;
  message: string;
  priority: TicketPriority;
  status: TicketStatus;
  createdAt: Date;
  updatedAt: Date;
}

const ticketSchema = new Schema<ISupportTicket>(
  {
    ticketNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      trim: true,
      lowercase: true,
    },
    category: {
      type: String,
      enum: [
        'General',
        'Storyteller Support',
        'Billing & Patronage',
        'Technical Bug',
        'Lore Preservation',
      ],
      default: 'General',
    },
    subject: {
      type: String,
      required: [true, 'Subject is required'],
      trim: true,
      maxlength: [200, 'Subject cannot exceed 200 characters'],
    },
    message: {
      type: String,
      required: [true, 'Message is required'],
      trim: true,
      maxlength: [5000, 'Message cannot exceed 5000 characters'],
    },
    priority: {
      type: String,
      enum: ['low', 'normal', 'high'],
      default: 'normal',
    },
    status: {
      type: String,
      enum: ['open', 'in_progress', 'resolved', 'closed'],
      default: 'open',
      index: true,
    },
  },
  { timestamps: true }
);

const SupportTicket = mongoose.model<ISupportTicket>('SupportTicket', ticketSchema);
export default SupportTicket;

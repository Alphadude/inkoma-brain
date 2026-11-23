import { Types } from 'mongoose';
import SupportTicket, { TicketCategory, TicketPriority } from '../models/ticket.model';
import ApiError from '../utils/ApiError';

/**
 * Returns categorized FAQs for Help Center.
 */
export const getFaqs = async (): Promise<any[]> => {
  return [
    {
      category: 'General',
      faqs: [
        {
          question: 'What is Inkoma?',
          answer: 'Inkoma is an interactive digital oral literature sanctuary dedicated to documenting, reimagining, and preserving African oral traditions, folklore, and mythologies through interactive branching stories and audio narrations.',
        },
        {
          question: 'Is Inkoma free to read?',
          answer: 'Yes! Readers have full free access to an extensive collection of published folk tales, mythologies, and cultural manuscripts across Africa and the diaspora.',
        },
        {
          question: 'Can I read offline?',
          answer: 'Stories added to your Personal Library can be cached for offline reading in supported mobile and modern desktop browsers.',
        },
      ],
    },
    {
      category: 'Storyteller Support',
      faqs: [
        {
          question: 'How do I become a verified Storyteller?',
          answer: 'Sign up for an Inkoma account, complete your Griot profile in Settings with your folklore tradition specialty, and submit your first story draft in Inkoma Studio.',
        },
        {
          question: 'How does interactive branching storytelling work?',
          answer: 'Inkoma Studio gives creators a visual node-based story builder where readers choose paths, make cultural decisions, and uncover divergent endings.',
        },
      ],
    },
    {
      category: 'Billing & Patronage',
      faqs: [
        {
          question: 'How do Cowrie tips reach storytellers?',
          answer: 'Tips are credited directly to the author\'s verified payout bank account configured under Settings > Banking Details.',
        },
        {
          question: 'Can I cancel my patron subscription anytime?',
          answer: 'Yes, patron contributions can be managed or canceled anytime with zero lock-in.',
        },
      ],
    },
    {
      category: 'Technical Bug',
      faqs: [
        {
          question: 'Audio narration is not playing on my browser.',
          answer: 'Ensure your browser permits media autoplay. If the issue persists, clear your browser cache or switch audio stream bitrate.',
        },
        {
          question: 'Where can I report a bug or cultural inaccuracy?',
          answer: 'Use the ticket form below to report bugs, manuscript errors, or cultural misattributions directly to our Griot Council.',
        },
      ],
    },
  ];
};

/**
 * Submits a new support inquiry or ticket.
 */
export const createTicket = async (
  userId: string | undefined,
  input: {
    name: string;
    email: string;
    category?: TicketCategory;
    subject: string;
    message: string;
    priority?: TicketPriority;
  }
): Promise<any> => {
  if (!input.name || !input.name.trim()) throw new ApiError(400, 'Name is required');
  if (!input.email || !input.email.includes('@')) throw new ApiError(400, 'Valid email is required');
  if (!input.subject || !input.subject.trim()) throw new ApiError(400, 'Subject is required');
  if (!input.message || !input.message.trim()) throw new ApiError(400, 'Message is required');

  const ticketNumber = `INK-${Math.floor(100000 + Math.random() * 900000)}`;

  const ticket = await SupportTicket.create({
    ticketNumber,
    user: userId ? new Types.ObjectId(userId) : undefined,
    name: input.name.trim(),
    email: input.email.trim().toLowerCase(),
    category: input.category || 'General',
    subject: input.subject.trim(),
    message: input.message.trim(),
    priority: input.priority || 'normal',
    status: 'open',
  });

  return {
    ticketNumber: ticket.ticketNumber,
    status: ticket.status,
    category: ticket.category,
    subject: ticket.subject,
    createdAt: ticket.createdAt,
    message: 'Your support ticket has been received. Our team will get back to you shortly.',
  };
};

/**
 * Returns tickets submitted by authenticated user.
 */
export const getUserTickets = async (userId: string): Promise<any[]> => {
  const tickets = await SupportTicket.find({ user: userId })
    .sort({ createdAt: -1 })
    .lean();

  return tickets.map((t) => ({
    ticketNumber: t.ticketNumber,
    category: t.category,
    subject: t.subject,
    status: t.status,
    priority: t.priority,
    createdAt: t.createdAt,
    updatedAt: t.updatedAt,
  }));
};

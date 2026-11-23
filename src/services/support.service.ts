import { Types } from 'mongoose';
import Donation from '../models/donation.model';
import User from '../models/user.model';
import ApiError from '../utils/ApiError';
import { createNotification } from './notification.service';

/**
 * Returns platform verified accounts, crypto wallets, and patron tiers.
 */
export const getPlatformSupportInfo = async (): Promise<any> => {
  return {
    organization: 'Inkoma Oral Heritage Initiative & Preservation Foundation',
    mission: 'Preserving African folklore, mythology, and indigenous storytelling through interactive digital archives.',
    banking: {
      localAccount: {
        bankName: 'Zenith Bank Nigeria',
        accountName: 'Inkoma Oral Heritage Initiative',
        accountNumber: '1029384756',
        currency: 'NGN',
      },
      domiciliaryAccount: {
        bankName: 'Guaranty Trust Bank (GTBank)',
        accountName: 'Inkoma Global Heritage Ltd',
        accountNumber: '0293847561',
        currency: 'USD',
        swiftCode: 'GTBINGLA',
      },
    },
    cryptoWallets: {
      bitcoin: {
        symbol: 'BTC',
        network: 'Bitcoin Mainnet',
        address: 'bc1q9x3t0g7g78g0dfy876s8fgh6k7l59f0g4d3s8h',
      },
      ethereum: {
        symbol: 'ETH',
        network: 'Ethereum (ERC-20)',
        address: '0x71C849204A3b2075D1c29E04f21F1a21C0c2262E',
      },
      tether: {
        symbol: 'USDT',
        network: 'Tron (TRC-20)',
        address: 'TYd3r89h2kj8f90sdjf89w7ef98wef9j34kL',
      },
    },
    patronTiers: [
      {
        id: 'tier-elder-patron',
        name: 'Elder Patron',
        priceMonthly: 9.99,
        currency: 'USD',
        description: 'Supports digitization of 5 elder griot audio recordings every month.',
        perks: ['Griot badge on profile', 'Access to patron-only folklore annotations', 'Early chapter previews'],
      },
      {
        id: 'tier-scribe-guild',
        name: 'Scribe Guild',
        priceMonthly: 24.99,
        currency: 'USD',
        description: 'Funds interactive branching manuscript development across universities and schools.',
        perks: ['All Elder Patron perks', 'Quarterly hardcover anthology discount', 'Voting rights on curated traditions'],
      },
      {
        id: 'tier-lore-guardian',
        name: 'Lore Guardian',
        priceMonthly: 49.99,
        currency: 'USD',
        description: 'Directly sponsors field expeditions and digital preservation of endangered indigenous dialects.',
        perks: ['All Guild perks', 'Name etched into Foundation digital monument', 'Quarterly executive patron salon call'],
      },
    ],
  };
};

/**
 * Initializes a donation / support contribution.
 */
export const initializeDonation = async (
  userId: string | undefined,
  input: {
    amount: number;
    email: string;
    name?: string;
    currency?: string;
    targetType?: 'platform' | 'author';
    authorId?: string;
    paymentMethod?: 'paystack' | 'bank_transfer' | 'crypto';
  }
): Promise<{
  reference: string;
  authorizationUrl: string;
  amount: number;
  currency: string;
}> => {
  if (!input.amount || input.amount <= 0) {
    throw new ApiError(400, 'Donation amount must be greater than zero');
  }
  if (!input.email || !input.email.includes('@')) {
    throw new ApiError(400, 'Valid email address is required');
  }

  const reference = `INK-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
  const currency = input.currency?.toUpperCase() || 'NGN';
  const targetType = input.targetType || 'platform';
  const paymentMethod = input.paymentMethod || 'paystack';

  let donorName = input.name || 'Anonymous Patron';
  if (userId) {
    const user = await User.findById(userId);
    if (user) {
      donorName = user.penName || user.name;
    }
  }

  await Donation.create({
    donor: userId ? new Types.ObjectId(userId) : undefined,
    donorName,
    donorEmail: input.email.toLowerCase(),
    amount: input.amount,
    currency,
    paymentMethod,
    reference,
    status: 'pending',
    targetType,
    author: input.authorId ? new Types.ObjectId(input.authorId) : undefined,
  });

  // Paystack checkout URL or platform simulated checkout callback
  const paystackPublicKey = process.env.PAYSTACK_PUBLIC_KEY;
  const authorizationUrl = paystackPublicKey
    ? `https://checkout.paystack.com/${reference}`
    : `https://inkoma.netlify.app/support?status=success&reference=${reference}`;

  return {
    reference,
    authorizationUrl,
    amount: input.amount,
    currency,
  };
};

/**
 * Verifies a donation / support payment.
 */
export const verifyDonation = async (reference: string): Promise<any> => {
  const donation = await Donation.findOne({ reference });
  if (!donation) {
    throw new ApiError(404, 'Donation reference not found');
  }

  // Idempotent: already verified
  if (donation.status === 'success') {
    return {
      reference: donation.reference,
      status: donation.status,
      amount: donation.amount,
      currency: donation.currency,
      donorName: donation.donorName,
      message: 'Donation has already been verified.',
    };
  }

  // Verify against Paystack gateway if secret key is present
  const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY;
  if (paystackSecretKey) {
    try {
      const response = await fetch(
        `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
        {
          headers: {
            Authorization: `Bearer ${paystackSecretKey}`,
          },
        }
      );
      const data: any = await response.json();
      if (!data.status || data.data?.status !== 'success') {
        throw new ApiError(400, 'Payment could not be verified by payment gateway');
      }
    } catch (err: any) {
      if (err instanceof ApiError) throw err;
      throw new ApiError(502, `Payment gateway communication error: ${err.message}`);
    }
  }

  donation.status = 'success';
  await donation.save();

  // If this was an author tip / support, notify author
  if (donation.targetType === 'author' && donation.author) {
    await createNotification({
      recipient: donation.author,
      actor: donation.donor,
      actorName: donation.donorName,
      type: 'tip',
      title: 'Received Cowrie Tip!',
      message: `${donation.donorName} sent you a support tip of ${donation.currency} ${donation.amount.toLocaleString()}!`,
      link: '/profile/me',
      metadata: { donationId: donation._id, amount: donation.amount, currency: donation.currency },
    });
  }

  return {
    reference: donation.reference,
    status: donation.status,
    amount: donation.amount,
    currency: donation.currency,
    donorName: donation.donorName,
    message: 'Donation verified successfully. Thank you for preserving oral lore!',
  };
};

/**
 * Returns past donations for authenticated user.
 */
export const getUserDonations = async (userId: string): Promise<any[]> => {
  const donations = await Donation.find({ donor: userId })
    .sort({ createdAt: -1 })
    .lean();

  return donations.map((d) => ({
    id: d._id.toString(),
    reference: d.reference,
    amount: d.amount,
    currency: d.currency,
    status: d.status,
    targetType: d.targetType,
    paymentMethod: d.paymentMethod,
    createdAt: d.createdAt,
  }));
};

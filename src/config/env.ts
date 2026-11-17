import dotenv from 'dotenv';

dotenv.config();

const REQUIRED: string[] = [
  'PORT',
  'NODE_ENV',
  'MONGO_URI',
  'JWT_SECRET',
  'JWT_EXPIRES_IN',
  'BCRYPT_ROUNDS',
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET',
];

const missing = REQUIRED.filter((key) => !process.env[key]);

if (missing.length > 0) {
  throw new Error(
    `Missing required environment variables: ${missing.join(', ')}\n` +
      `Copy .env.example to .env and fill in the values.`
  );
}

interface EnvConfig {
  port: number;
  nodeEnv: string;
  mongoUri: string;
  jwtSecret: string;
  jwtExpiresIn: string;
  bcryptRounds: number;
  allowedOrigins: string[];
  cloudinary: {
    cloudName: string;
    apiKey: string;
    apiSecret: string;
    url?: string;
  };
}

const env: EnvConfig = {
  port: parseInt(process.env.PORT as string, 10) || 5000,
  nodeEnv: process.env.NODE_ENV as string,
  mongoUri: process.env.MONGO_URI as string,
  jwtSecret: process.env.JWT_SECRET as string,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN as string,
  bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS as string, 10) || 12,
  allowedOrigins: (process.env.ALLOWED_ORIGINS || '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean),
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME as string,
    apiKey: process.env.CLOUDINARY_API_KEY as string,
    apiSecret: process.env.CLOUDINARY_API_SECRET as string,
    url: process.env.CLOUDINARY_URL,
  },
};

export default env;

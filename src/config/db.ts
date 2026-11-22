import dns from 'dns';
import mongoose from 'mongoose';
import logger from '../utils/logger';

// Use reliable public DNS resolvers to prevent Atlas SRV resolution failures
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch {
  // Ignore if unable to set custom DNS servers in environment
}

const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 5000;

const connectDB = async (retries: number = MAX_RETRIES): Promise<void> => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI as string, {
      serverSelectionTimeoutMS: 5000,
    });

    logger.info(`✅  MongoDB connected: ${conn.connection.host}`);

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
    });

    mongoose.connection.on('error', (err: Error) => {
      logger.error('MongoDB connection error:', err);
    });
  } catch (err) {
    logger.error(`MongoDB connection failed: ${(err as Error).message}`);

    if (retries > 0) {
      logger.info(`Retrying in ${RETRY_DELAY_MS / 1000}s… (${retries} attempts left)`);
      await new Promise((res) => setTimeout(res, RETRY_DELAY_MS));
      return connectDB(retries - 1);
    }

    logger.error('Max retries reached. Exiting.');
    process.exit(1);
  }
};

export default connectDB;

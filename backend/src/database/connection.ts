import mongoose from 'mongoose';
import { config } from '../config';

let isConnected = false;

export async function connectDB(): Promise<boolean> {
  if (isConnected) {
    return true;
  }

  try {
    const opts: mongoose.ConnectOptions = {
      serverSelectionTimeoutMS: 2000,
      connectTimeoutMS: 4000,
    };

    console.log(`[Database] Attempting connection to MongoDB at: ${config.mongodbUri.replace(/\/\/([^:]+):([^@]+)@/, '//$1:***@')}`);
    await mongoose.connect(config.mongodbUri, opts);
    isConnected = true;
    console.log('[Database] MongoDB connected successfully.');
    return true;
  } catch (error: any) {
    console.warn(`[Database] Warning: MongoDB connection failed (${error.message}).`);
    console.warn('[Database] Ensure MongoDB is running locally (e.g. at 127.0.0.1:27017) or set MONGODB_URI in .env to MongoDB Atlas.');
    isConnected = false;
    return false;
  }
}

export function isDbConnected(): boolean {
  return mongoose.connection.readyState === 1;
}

export async function disconnectDB(): Promise<void> {
  if (isConnected) {
    await mongoose.disconnect();
    isConnected = false;
    console.log('[Database] Disconnected from MongoDB.');
  }
}

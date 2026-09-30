import mongoose from 'mongoose';
import { env } from '../config/env.js';

export async function connectToDatabase(): Promise<void> {
  await mongoose.connect(env.MONGODB_URI);
}

export async function disconnectFromDatabase(): Promise<void> {
  await mongoose.disconnect();
}

export function isDatabaseReady(): boolean {
  return mongoose.connection.readyState === 1;
}

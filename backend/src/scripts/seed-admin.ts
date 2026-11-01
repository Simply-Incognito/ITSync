import { z } from 'zod';
import { connectToDatabase, disconnectFromDatabase } from '../database/mongoose.js';
import { User } from '../modules/identity/models/user.model.js';
import { hashPassword } from '../modules/identity/utils/password.js';

const emailSchema = z.email().max(254);
const passwordSchema = z.string().min(12).max(128);

async function seedAdministrator(): Promise<void> {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    throw new Error('ADMIN_EMAIL and ADMIN_PASSWORD must be set in the process environment.');
  }
  if (!emailSchema.safeParse(email).success) {
    throw new Error('ADMIN_EMAIL must be a valid email address.');
  }
  if (!passwordSchema.safeParse(password).success) {
    throw new Error('ADMIN_PASSWORD must be between 12 and 128 characters.');
  }

  await connectToDatabase();
  try {
    const existingUser = await User.findOne({ email }).select('_id');
    if (existingUser) {
      throw new Error(`An account for ${email} already exists; no changes were made.`);
    }

    await User.create({
      email,
      passwordHash: await hashPassword(password),
      role: 'administrator',
    });

    console.info(`Administrator account created for ${email}.`);
  } finally {
    await disconnectFromDatabase();
  }
}

seedAdministrator().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : 'Administrator seeding failed.');
  process.exitCode = 1;
});

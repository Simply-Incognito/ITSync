import { model, Schema } from 'mongoose';

export const userRoles = ['student', 'organization_representative', 'administrator'] as const;
export const userStatuses = ['active', 'suspended'] as const;

export type UserRole = (typeof userRoles)[number];
export type UserStatus = (typeof userStatuses)[number];

const userSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
      select: false,
    },
    role: {
      type: String,
      enum: userRoles,
      required: true,
    },
    status: {
      type: String,
      enum: userStatuses,
      default: 'active',
      required: true,
    },
    emailVerifiedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
);

userSchema.index({ email: 1 }, { unique: true });

export const User = model('User', userSchema);

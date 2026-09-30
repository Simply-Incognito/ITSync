import { model, Schema } from 'mongoose';

export const authTokenPurposes = ['session', 'password_reset'] as const;
export type AuthTokenPurpose = (typeof authTokenPurposes)[number];

const authTokenSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    tokenHash: { type: String, required: true },
    purpose: { type: String, enum: authTokenPurposes, required: true },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true },
);

authTokenSchema.index({ tokenHash: 1, purpose: 1 }, { unique: true });
authTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const AuthToken = model('AuthToken', authTokenSchema);

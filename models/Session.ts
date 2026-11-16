import mongoose, { Schema, Types, type Model } from "mongoose";

export interface ISession {
  /** SHA-256 of the cookie token; the raw token is never stored. */
  tokenHash: string;
  userId: Types.ObjectId;
  expiresAt: Date;
  createdAt: Date;
}

const SessionSchema = new Schema<ISession>(
  {
    tokenHash: { type: String, required: true, unique: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

// MongoDB removes expired sessions automatically.
SessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const Session: Model<ISession> =
  (mongoose.models.Session as Model<ISession> | undefined) ||
  mongoose.model<ISession>("Session", SessionSchema);

import mongoose, { Schema, type Model } from "mongoose";

export interface IUser {
  githubId: number;
  username: string;
  avatarUrl: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    githubId: { type: Number, required: true, unique: true },
    username: { type: String, required: true, trim: true },
    avatarUrl: { type: String, default: "" },
  },
  { timestamps: true }
);

export const User: Model<IUser> =
  (mongoose.models.User as Model<IUser> | undefined) ||
  mongoose.model<IUser>("User", UserSchema);

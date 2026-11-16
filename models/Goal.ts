import mongoose, { Schema, type Model } from "mongoose";

export interface IGoal {
  title: string;
  description: string;
  progress: number;
  createdAt: Date;
  updatedAt: Date;
}

const GoalSchema = new Schema<IGoal>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    progress: { type: Number, default: 0, min: 0, max: 100 },
  },
  { timestamps: true }
);

export const Goal: Model<IGoal> =
  (mongoose.models.Goal as Model<IGoal> | undefined) ||
  mongoose.model<IGoal>("Goal", GoalSchema);

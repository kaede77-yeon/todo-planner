import mongoose, { Schema, Types, type Model } from "mongoose";

export interface IWeeklyGoal {
  text: string;
  done: boolean;
}

export interface IWeeklyPlan {
  weekStart: Date;
  goals: IWeeklyGoal[];
  memo: string;
  retrospective: string;
  goalId?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export const MAX_WEEKLY_GOALS = 5;

const WeeklyGoalSchema = new Schema<IWeeklyGoal>({
  text: { type: String, required: true, trim: true },
  done: { type: Boolean, default: false },
});

const WeeklyPlanSchema = new Schema<IWeeklyPlan>(
  {
    weekStart: { type: Date, required: true, unique: true },
    goals: {
      type: [WeeklyGoalSchema],
      default: [],
      validate: {
        validator: (v: IWeeklyGoal[]) => v.length <= MAX_WEEKLY_GOALS,
        message: `goals cannot exceed ${MAX_WEEKLY_GOALS} items`,
      },
    },
    memo: { type: String, default: "" },
    retrospective: { type: String, default: "" },
    goalId: { type: Schema.Types.ObjectId, ref: "Goal" },
  },
  { timestamps: true }
);

export const WeeklyPlan: Model<IWeeklyPlan> =
  (mongoose.models.WeeklyPlan as Model<IWeeklyPlan> | undefined) ||
  mongoose.model<IWeeklyPlan>("WeeklyPlan", WeeklyPlanSchema);

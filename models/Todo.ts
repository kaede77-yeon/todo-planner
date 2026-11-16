import mongoose, { Schema, Types, type Model } from "mongoose";
import type { TodoPriority, TodoStatus } from "@/types";

export interface ITodo {
  title: string;
  description?: string;
  status: TodoStatus;
  priority: TodoPriority;
  dueDate?: Date;
  dayOfWeek?: number;
  order: string;
  weeklyPlanId?: Types.ObjectId;
  goalId?: Types.ObjectId;
  /** Owner. Set by the server from the session, never from the request body. */
  userId: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export const TODO_FIELDS = [
  "title",
  "description",
  "status",
  "priority",
  "dueDate",
  "dayOfWeek",
  "order",
  "weeklyPlanId",
  "goalId",
] as const;

const TodoSchema = new Schema<ITodo>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String },
    status: {
      type: String,
      enum: ["todo", "doing", "done"],
      required: true,
      default: "todo",
    },
    priority: {
      type: String,
      enum: ["high", "medium", "low"],
      default: "medium",
    },
    dueDate: { type: Date },
    dayOfWeek: { type: Number, min: 0, max: 6 },
    order: { type: String, required: true },
    weeklyPlanId: { type: Schema.Types.ObjectId, ref: "WeeklyPlan" },
    goalId: { type: Schema.Types.ObjectId, ref: "Goal" },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

TodoSchema.index({ status: 1, order: 1 });
TodoSchema.index({ userId: 1, status: 1, order: 1 });

export const Todo: Model<ITodo> =
  (mongoose.models.Todo as Model<ITodo> | undefined) ||
  mongoose.model<ITodo>("Todo", TodoSchema);

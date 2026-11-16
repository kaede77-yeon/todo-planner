import type { TodoSlice } from "./todoSlice";
import type { WeeklySlice } from "./weeklySlice";
import type { GoalSlice } from "./goalSlice";

export type AppState = TodoSlice & WeeklySlice & GoalSlice;

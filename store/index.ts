import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { createTodoSlice } from "./todoSlice";
import { createWeeklySlice } from "./weeklySlice";
import { createGoalSlice } from "./goalSlice";
import type { AppState } from "./types";

export type { AppState } from "./types";

export const useStore = create<AppState>()(
  devtools(
    (...a) => ({
      ...createTodoSlice(...a),
      ...createWeeklySlice(...a),
      ...createGoalSlice(...a),
    }),
    { name: "todo-planner", enabled: process.env.NODE_ENV !== "production" }
  )
);

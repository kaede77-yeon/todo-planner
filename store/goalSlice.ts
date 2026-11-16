import type { StateCreator } from "zustand";
import type { Goal } from "@/types";
import { errorMessage, request } from "./api";
import type { AppState } from "./types";

export type GoalInput = Partial<Pick<Goal, "title" | "description" | "progress">>;

export interface GoalSlice {
  goals: Goal[];
  goalsLoading: boolean;
  goalsError: string | null;
  fetchGoals: () => Promise<void>;
  addGoal: (input: GoalInput) => Promise<Goal | null>;
  updateGoal: (id: string, patch: GoalInput) => Promise<Goal | null>;
  deleteGoal: (id: string) => Promise<boolean>;
}

export const createGoalSlice: StateCreator<
  AppState,
  [["zustand/devtools", never]],
  [],
  GoalSlice
> = (set, get) => ({
  goals: [],
  goalsLoading: false,
  goalsError: null,
  fetchGoals: async () => {
    set({ goalsLoading: true, goalsError: null }, false, "goals/fetch");
    try {
      const goals = await request<Goal[]>("/api/goals");
      set({ goals, goalsLoading: false }, false, "goals/fetch/ok");
    } catch (err) {
      set(
        { goalsLoading: false, goalsError: errorMessage(err) },
        false,
        "goals/fetch/err"
      );
    }
  },
  addGoal: async (input) => {
    set({ goalsError: null }, false, "goals/add");
    try {
      const goal = await request<Goal>("/api/goals", {
        method: "POST",
        body: input,
      });
      set((s) => ({ goals: [...s.goals, goal] }), false, "goals/add/ok");
      return goal;
    } catch (err) {
      set({ goalsError: errorMessage(err) }, false, "goals/add/err");
      return null;
    }
  },
  updateGoal: async (id, patch) => {
    set({ goalsError: null }, false, "goals/update");
    try {
      const goal = await request<Goal>(`/api/goals/${id}`, {
        method: "PUT",
        body: patch,
      });
      set(
        (s) => ({ goals: s.goals.map((g) => (g._id === id ? goal : g)) }),
        false,
        "goals/update/ok"
      );
      return goal;
    } catch (err) {
      set({ goalsError: errorMessage(err) }, false, "goals/update/err");
      return null;
    }
  },
  deleteGoal: async (id) => {
    set({ goalsError: null }, false, "goals/delete");
    try {
      await request<{ success: boolean }>(`/api/goals/${id}`, {
        method: "DELETE",
      });
      // API unsets goalId server-side; mirror that on locally cached docs.
      const { todos, plans } = get();
      const clear = <T extends { goalId?: string }>(items: T[]): T[] =>
        items.map((item) => {
          if (item.goalId !== id) return item;
          const rest = { ...item };
          delete rest.goalId;
          return rest;
        });
      set(
        (s) => ({
          goals: s.goals.filter((g) => g._id !== id),
          todos: clear(todos),
          plans: clear(plans),
        }),
        false,
        "goals/delete/ok"
      );
      return true;
    } catch (err) {
      set({ goalsError: errorMessage(err) }, false, "goals/delete/err");
      return false;
    }
  },
});

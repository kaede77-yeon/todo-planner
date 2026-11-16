import type { StateCreator } from "zustand";
import type { WeeklyPlan } from "@/types";
import { errorMessage, request } from "./api";
import type { AppState } from "./types";

/** `goalId: null` explicitly unlinks the 1년 목표 (undefined would be dropped by JSON). */
export type WeeklyInput = Partial<
  Omit<WeeklyPlan, "_id" | "createdAt" | "updatedAt" | "goalId">
> & { goalId?: string | null };

export interface WeeklySlice {
  plans: WeeklyPlan[];
  plansLoading: boolean;
  plansError: string | null;
  fetchPlans: (weekStart?: string) => Promise<void>;
  addPlan: (input: WeeklyInput) => Promise<WeeklyPlan | null>;
  updatePlan: (id: string, patch: WeeklyInput) => Promise<WeeklyPlan | null>;
  deletePlan: (id: string) => Promise<boolean>;
  toggleGoal: (
    planId: string,
    index: number,
    done: boolean
  ) => Promise<WeeklyPlan | null>;
}

export const createWeeklySlice: StateCreator<
  AppState,
  [["zustand/devtools", never]],
  [],
  WeeklySlice
> = (set) => ({
  plans: [],
  plansLoading: false,
  plansError: null,
  fetchPlans: async (weekStart) => {
    set({ plansLoading: true, plansError: null }, false, "weekly/fetch");
    try {
      const qs = weekStart ? `?weekStart=${encodeURIComponent(weekStart)}` : "";
      const plans = await request<WeeklyPlan[]>(`/api/weekly${qs}`);
      set({ plans, plansLoading: false }, false, "weekly/fetch/ok");
    } catch (err) {
      set(
        { plansLoading: false, plansError: errorMessage(err) },
        false,
        "weekly/fetch/err"
      );
    }
  },
  addPlan: async (input) => {
    set({ plansError: null }, false, "weekly/add");
    try {
      const plan = await request<WeeklyPlan>("/api/weekly", {
        method: "POST",
        body: input,
      });
      set((s) => ({ plans: [plan, ...s.plans] }), false, "weekly/add/ok");
      return plan;
    } catch (err) {
      set({ plansError: errorMessage(err) }, false, "weekly/add/err");
      return null;
    }
  },
  updatePlan: async (id, patch) => {
    set({ plansError: null }, false, "weekly/update");
    try {
      const plan = await request<WeeklyPlan>(`/api/weekly/${id}`, {
        method: "PUT",
        body: patch,
      });
      set(
        (s) => ({ plans: s.plans.map((p) => (p._id === id ? plan : p)) }),
        false,
        "weekly/update/ok"
      );
      return plan;
    } catch (err) {
      set({ plansError: errorMessage(err) }, false, "weekly/update/err");
      return null;
    }
  },
  deletePlan: async (id) => {
    set({ plansError: null }, false, "weekly/delete");
    try {
      await request<{ success: boolean }>(`/api/weekly/${id}`, {
        method: "DELETE",
      });
      set(
        (s) => ({ plans: s.plans.filter((p) => p._id !== id) }),
        false,
        "weekly/delete/ok"
      );
      return true;
    } catch (err) {
      set({ plansError: errorMessage(err) }, false, "weekly/delete/err");
      return false;
    }
  },
  toggleGoal: async (planId, index, done) => {
    set({ plansError: null }, false, "weekly/toggleGoal");
    try {
      const plan = await request<WeeklyPlan>(`/api/weekly/${planId}`, {
        method: "PATCH",
        body: { index, done },
      });
      set(
        (s) => ({ plans: s.plans.map((p) => (p._id === planId ? plan : p)) }),
        false,
        "weekly/toggleGoal/ok"
      );
      return plan;
    } catch (err) {
      set({ plansError: errorMessage(err) }, false, "weekly/toggleGoal/err");
      return null;
    }
  },
});

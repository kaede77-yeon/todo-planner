import type { Todo, WeeklyGoal } from "@/types";

/** Percentage (0-100, rounded) of weekly goals that are done. 0 when there are no goals. */
export function weeklyProgress(goals: readonly Pick<WeeklyGoal, "done">[]): number {
  if (goals.length === 0) return 0;
  const done = goals.filter((g) => g.done).length;
  return Math.round((done / goals.length) * 100);
}

/** Percentage (0-100, rounded) of todos linked to `goalId` that are done. 0 when none are linked. */
export function goalProgress(
  todos: readonly Pick<Todo, "status" | "goalId">[],
  goalId: string
): number {
  const linked = todos.filter((t) => t.goalId === goalId);
  if (linked.length === 0) return 0;
  const done = linked.filter((t) => t.status === "done").length;
  return Math.round((done / linked.length) * 100);
}

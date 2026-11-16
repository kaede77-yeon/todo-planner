import type { Goal, Todo, TodoStatus, WeeklyPlan } from "@/types";

export type StatusCounts = Record<TodoStatus, number>;

export function countByStatus(todos: readonly Pick<Todo, "status">[]): StatusCounts {
  const counts: StatusCounts = { todo: 0, doing: 0, done: 0 };
  for (const t of todos) counts[t.status] += 1;
  return counts;
}

export function todosForPlan(todos: readonly Todo[], planId: string): Todo[] {
  return todos.filter((t) => t.weeklyPlanId === planId);
}

/**
 * Per-goal count of the plan's linked todos. Todos without a goalId, or whose
 * goalId is not in `goals`, are ignored; goals with no linked todo are omitted.
 */
export function todosPerGoal(
  todos: readonly Todo[],
  plan: Pick<WeeklyPlan, "_id">,
  goals: readonly Goal[]
): { goal: Goal; count: number }[] {
  const planTodos = todosForPlan(todos, plan._id);
  return goals
    .map((goal) => ({
      goal,
      count: planTodos.filter((t) => t.goalId === goal._id).length,
    }))
    .filter((r) => r.count > 0);
}

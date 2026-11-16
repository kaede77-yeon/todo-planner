import type { Todo } from "@/types";

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * The Monday (weeks run Mon..Sun) of the LOCAL calendar week containing `date`,
 * returned as that calendar day at 00:00 UTC.
 *
 * The week is decided by the user's local calendar so that, e.g., Monday 08:00
 * in KST (still Sunday in UTC) belongs to the new week. The result is stored as
 * a UTC-midnight "date-only" value so it is stable in the DB and
 * `formatWeekRange` (which reads UTC fields) shows the same calendar days.
 */
export function getWeekStart(date: Date): Date {
  const daysSinceMonday = (date.getDay() + 6) % 7;
  return new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate() - daysSinceMonday)
  );
}

function md(d: Date): string {
  return `${d.getUTCMonth() + 1}/${d.getUTCDate()}`;
}

/** e.g. "2024/1/1 ~ 1/7" (Mon..Sun, UTC) for a weekStart value. */
export function formatWeekRange(weekStart: Date | string): string {
  const start = new Date(weekStart);
  const end = new Date(start.getTime() + 6 * DAY_MS);
  return `${start.getUTCFullYear()}/${md(start)} ~ ${md(end)}`;
}

/** Columns shown Monday..Sunday, as dayOfWeek values (0=Sun..6=Sat). */
export const WEEK_DAY_ORDER = [1, 2, 3, 4, 5, 6, 0] as const;
export const DAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"] as const;

/** Todos of `planId` that have a day, grouped by dayOfWeek (0..6). */
export function groupTodosByDay(
  todos: Todo[],
  planId: string
): Record<number, Todo[]> {
  const groups: Record<number, Todo[]> = {
    0: [],
    1: [],
    2: [],
    3: [],
    4: [],
    5: [],
    6: [],
  };
  for (const t of todos) {
    if (t.weeklyPlanId !== planId) continue;
    if (typeof t.dayOfWeek !== "number" || !(t.dayOfWeek in groups)) continue;
    groups[t.dayOfWeek].push(t);
  }
  for (const list of Object.values(groups)) {
    list.sort((a, b) => (a.order < b.order ? -1 : a.order > b.order ? 1 : 0));
  }
  return groups;
}

/** Highest `order` among todos with the given status, or null if none. */
export function lastOrder(
  todos: Todo[],
  status: Todo["status"]
): string | null {
  let last: string | null = null;
  for (const t of todos) {
    if (t.status === status && (last === null || t.order > last)) last = t.order;
  }
  return last;
}

export const MAX_WEEKLY_GOALS = 5;

export function canAddGoal(count: number): boolean {
  return count < MAX_WEEKLY_GOALS;
}

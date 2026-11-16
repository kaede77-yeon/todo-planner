import type { Todo, TodoPriority, TodoStatus } from "@/types";
import { compareOrder, orderForInsert } from "./fractionalIndex";

export const STATUSES: TodoStatus[] = ["todo", "doing", "done"];

export function sortedByOrder(todos: Todo[], status: TodoStatus): Todo[] {
  return todos
    .filter((t) => t.status === status)
    .sort((a, b) => compareOrder(a.order, b.order));
}

const PRIORITY_RANK: Record<TodoPriority, number> = { high: 0, medium: 1, low: 2 };

/** Priority first (high > medium > low), then fractional `order`. */
export function compareTodos(a: Todo, b: Todo): number {
  return (
    PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority] ||
    compareOrder(a.order, b.order)
  );
}

/** Todos of a column as displayed: priority first, then order. */
export function sortedForColumn(todos: Todo[], status: TodoStatus): Todo[] {
  return todos.filter((t) => t.status === status).sort(compareTodos);
}

export interface MoveInput {
  todos: Todo[];
  activeId: string;
  overStatus: TodoStatus;
  /**
   * Insert position within the displayed (priority-sorted) target column,
   * excluding the active card. The card keeps its priority, so the position is
   * mapped to the slot among same-priority cards: dropping into another
   * priority's zone lands at the nearest edge of the card's own group.
   */
  overIndex: number;
}

export function computeMove({
  todos,
  activeId,
  overStatus,
  overIndex,
}: MoveInput): { status: TodoStatus; order: string } {
  const active = todos.find((t) => t._id === activeId);
  const column = sortedForColumn(todos, overStatus).filter(
    (t) => t._id !== activeId
  );
  const group = active
    ? column.filter((t) => t.priority === active.priority)
    : column;
  const clamped = Math.max(0, Math.min(overIndex, column.length));
  const groupIndex = active
    ? column.slice(0, clamped).filter((t) => t.priority === active.priority)
        .length
    : clamped;
  return {
    status: overStatus,
    order: orderForInsert(
      group.map((t) => t.order),
      groupIndex
    ),
  };
}

/** Local calendar date as YYYY-MM-DD. */
export function localDateString(now: Date): string {
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${m}-${d}`;
}

/** True when dueDate (date part) is before today's local date and not done. */
export function isOverdue(
  todo: Pick<Todo, "dueDate" | "status">,
  now: Date
): boolean {
  if (!todo.dueDate || todo.status === "done") return false;
  return todo.dueDate.slice(0, 10) < localDateString(now);
}

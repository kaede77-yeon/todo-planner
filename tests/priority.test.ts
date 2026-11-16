import { describe, expect, it } from "vitest";
import { compareTodos, computeMove, isOverdue, sortedForColumn } from "@/lib/kanban";
import type { Todo, TodoPriority, TodoStatus } from "@/types";

const T = "2024-01-01T00:00:00.000Z";
const mk = (
  id: string,
  priority: TodoPriority,
  order: string,
  status: TodoStatus = "todo"
): Todo => ({ _id: id, title: id, status, priority, order, createdAt: T, updatedAt: T });

describe("sortedForColumn", () => {
  it("sorts high > medium > low, then by order", () => {
    const todos = [
      mk("l1", "low", "a0"),
      mk("m2", "medium", "a1"),
      mk("h2", "high", "a2"),
      mk("m1", "medium", "a0"),
      mk("h1", "high", "a1"),
      mk("x", "high", "a0", "done"),
    ];
    expect(sortedForColumn(todos, "todo").map((t) => t._id)).toEqual([
      "h1", "h2", "m1", "m2", "l1",
    ]);
  });
  it("compareTodos ranks priority before order", () => {
    expect(compareTodos(mk("a", "high", "z"), mk("b", "low", "a"))).toBeLessThan(0);
  });
});

describe("computeMove with priorities", () => {
  const todos = [
    mk("h1", "high", "a0"),
    mk("h2", "high", "a1"),
    mk("m1", "medium", "a0"),
    mk("m2", "medium", "a1"),
    mk("act", "medium", "a5"),
  ];
  it("orders relative to same-priority neighbours", () => {
    // displayed (active excluded): h1 h2 m1 m2; drop between m1 and m2
    const r = computeMove({ todos, activeId: "act", overStatus: "todo", overIndex: 3 });
    expect(r.order > "a0" && r.order < "a1").toBe(true);
  });
  it("dropping into a higher priority zone lands at own group's start", () => {
    const r = computeMove({ todos, activeId: "act", overStatus: "todo", overIndex: 0 });
    expect(r.order < "a0").toBe(true);
  });
  it("dropping at the end lands after own group's last", () => {
    const r = computeMove({ todos, activeId: "act", overStatus: "todo", overIndex: 99 });
    expect(r.order > "a1").toBe(true);
  });
});

describe("isOverdue", () => {
  const now = new Date(2024, 4, 15, 13, 30); // local May 15
  it("today is not overdue", () =>
    expect(isOverdue({ dueDate: "2024-05-15", status: "todo" }, now)).toBe(false));
  it("yesterday is overdue", () =>
    expect(isOverdue({ dueDate: "2024-05-14T00:00:00.000Z", status: "doing" }, now)).toBe(true));
  it("done is never overdue", () =>
    expect(isOverdue({ dueDate: "2024-05-01", status: "done" }, now)).toBe(false));
  it("no date is not overdue", () =>
    expect(isOverdue({ status: "todo" }, now)).toBe(false));
});

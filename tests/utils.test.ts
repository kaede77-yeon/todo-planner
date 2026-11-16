import { describe, expect, it } from "vitest";
import type { Todo } from "@/types";
import {
  canAddGoal,
  formatWeekRange,
  getWeekStart,
  groupTodosByDay,
  lastOrder,
} from "@/lib/utils";

// Dates are built with LOCAL constructors (year, monthIndex, day, hour, min):
// the week is decided by the local calendar, so these hold in any timezone.
const local = (y: number, m: number, d: number, h = 0, min = 0) =>
  getWeekStart(new Date(y, m - 1, d, h, min)).toISOString();

describe("getWeekStart (local calendar week, stored as UTC midnight)", () => {
  it("Monday stays Monday", () => {
    expect(local(2024, 1, 1, 15, 30)).toBe("2024-01-01T00:00:00.000Z");
  });
  it("Monday 00:00 local is already the new week", () => {
    expect(local(2024, 1, 8, 0, 0)).toBe("2024-01-08T00:00:00.000Z");
  });
  it("Monday 08:00 local is the new week (KST regression: still Sunday in UTC)", () => {
    expect(local(2024, 1, 8, 8, 0)).toBe("2024-01-08T00:00:00.000Z");
  });
  it("Sunday 23:59 local maps to the previous Monday", () => {
    expect(local(2024, 1, 7, 23, 59)).toBe("2024-01-01T00:00:00.000Z");
  });
  it("Saturday maps to Monday of the same week", () => {
    expect(local(2024, 1, 6, 12)).toBe("2024-01-01T00:00:00.000Z");
  });
  it("crosses month boundary", () => {
    expect(local(2024, 3, 2)).toBe("2024-02-26T00:00:00.000Z");
  });
  it("crosses year boundary", () => {
    expect(local(2025, 1, 1, 10)).toBe("2024-12-30T00:00:00.000Z");
  });
});

describe("formatWeekRange", () => {
  it("formats Mon..Sun across a month end", () => {
    expect(formatWeekRange("2024-02-26T00:00:00.000Z")).toBe("2024/2/26 ~ 3/3");
  });
});

const T = "2024-01-01T00:00:00.000Z";
const todo = (p: Partial<Todo> & { _id: string }): Todo => ({
  title: "t",
  status: "todo",
  priority: "medium",
  order: "a0",
  createdAt: T,
  updatedAt: T,
  ...p,
});

describe("groupTodosByDay", () => {
  it("groups by day for the plan only, sorted by order", () => {
    const g = groupTodosByDay(
      [
        todo({ _id: "1", weeklyPlanId: "p", dayOfWeek: 1, order: "a2" }),
        todo({ _id: "2", weeklyPlanId: "p", dayOfWeek: 1, order: "a1" }),
        todo({ _id: "3", weeklyPlanId: "other", dayOfWeek: 1 }),
        todo({ _id: "4", weeklyPlanId: "p" }),
        todo({ _id: "5", weeklyPlanId: "p", dayOfWeek: 0 }),
      ],
      "p"
    );
    expect(g[1].map((t) => t._id)).toEqual(["2", "1"]);
    expect(g[0].map((t) => t._id)).toEqual(["5"]);
    expect(g[2]).toEqual([]);
  });
});

describe("lastOrder / canAddGoal", () => {
  it("returns max order for the status or null", () => {
    expect(lastOrder([], "todo")).toBeNull();
    expect(
      lastOrder(
        [
          todo({ _id: "1", order: "a1" }),
          todo({ _id: "2", order: "a3" }),
          todo({ _id: "3", order: "z", status: "done" }),
        ],
        "todo"
      )
    ).toBe("a3");
  });
  it("limits goals to 5", () => {
    expect(canAddGoal(4)).toBe(true);
    expect(canAddGoal(5)).toBe(false);
  });
});

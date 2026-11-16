import { describe, expect, it } from "vitest";
import { goalProgress, weeklyProgress } from "@/lib/progress";

describe("weeklyProgress", () => {
  it("is 0 for no goals", () => expect(weeklyProgress([])).toBe(0));
  it("is 25 when 1 of 4 is done", () =>
    expect(weeklyProgress([{ done: true }, { done: false }, { done: false }, { done: false }])).toBe(25));
  it("is 100 when all done", () => expect(weeklyProgress([{ done: true }, { done: true }])).toBe(100));
  it("rounds 1 of 3 to 33", () =>
    expect(weeklyProgress([{ done: true }, { done: false }, { done: false }])).toBe(33));
});

describe("goalProgress", () => {
  const todos = [
    { status: "done" as const, goalId: "g1" },
    { status: "todo" as const, goalId: "g1" },
    { status: "doing" as const, goalId: "g1" },
    { status: "done" as const, goalId: "g1" },
    { status: "done" as const, goalId: "g2" },
    { status: "todo" as const, goalId: undefined },
  ];
  it("counts only todos linked to the goal", () => expect(goalProgress(todos, "g1")).toBe(50));
  it("is 100 when the only linked todo is done", () => expect(goalProgress(todos, "g2")).toBe(100));
  it("is 0 when nothing is linked", () => expect(goalProgress(todos, "none")).toBe(0));
});

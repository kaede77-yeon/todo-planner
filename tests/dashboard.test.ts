import { describe, expect, it } from "vitest";
import { countByStatus, todosForPlan, todosPerGoal } from "@/lib/dashboard";
import type { Goal, Todo, TodoStatus } from "@/types";

const t = (id: string, status: TodoStatus, weeklyPlanId?: string, goalId?: string): Todo => ({
  _id: id, title: id, status, priority: "medium", order: "a",
  weeklyPlanId, goalId, createdAt: "", updatedAt: "",
});
const g = (id: string): Goal => ({ _id: id, title: id, description: "", progress: 0, createdAt: "", updatedAt: "" });

describe("countByStatus", () => {
  it("is all zero for empty input", () => expect(countByStatus([])).toEqual({ todo: 0, doing: 0, done: 0 }));
  it("counts each status", () =>
    expect(countByStatus([t("1", "todo"), t("2", "done"), t("3", "done"), t("4", "doing")])).toEqual({ todo: 1, doing: 1, done: 2 }));
});

describe("todosForPlan", () => {
  it("is empty for empty input", () => expect(todosForPlan([], "p")).toEqual([]));
  it("keeps only todos of the plan", () =>
    expect(todosForPlan([t("1", "todo", "p"), t("2", "todo", "q"), t("3", "todo")], "p").map((x) => x._id)).toEqual(["1"]));
});

describe("todosPerGoal", () => {
  const plan = { _id: "p" };
  it("is empty for empty inputs", () => expect(todosPerGoal([], plan, [])).toEqual([]));
  it("counts plan todos per goal", () => {
    const res = todosPerGoal([t("1", "todo", "p", "a"), t("2", "done", "p", "a"), t("3", "todo", "p", "b")], plan, [g("a"), g("b")]);
    expect(res.map((r) => [r.goal._id, r.count])).toEqual([["a", 2], ["b", 1]]);
  });
  it("ignores todos without goalId", () =>
    expect(todosPerGoal([t("1", "todo", "p")], plan, [g("a")])).toEqual([]));
  it("ignores todos of other plans", () =>
    expect(todosPerGoal([t("1", "todo", "q", "a")], plan, [g("a")])).toEqual([]));
  it("ignores todos whose goal is not in the goals list", () =>
    expect(todosPerGoal([t("1", "todo", "p", "zzz")], plan, [g("a")])).toEqual([]));
});

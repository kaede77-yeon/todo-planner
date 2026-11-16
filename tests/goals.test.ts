import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useStore } from "@/store";
import type { Goal, Todo, WeeklyPlan } from "@/types";
import { validateGoalForm } from "@/components/goals/validate";

const T = "2024-01-01T00:00:00.000Z";
const fetchMock = vi.fn();

const goal = (id: string): Goal => ({
  _id: id,
  title: id,
  description: "",
  progress: 0,
  createdAt: T,
  updatedAt: T,
});
const todo = (id: string, goalId?: string): Todo => ({
  _id: id,
  title: id,
  status: "todo",
  priority: "medium",
  order: "a0",
  goalId,
  createdAt: T,
  updatedAt: T,
});
const plan = (id: string, goalId?: string): WeeklyPlan => ({
  _id: id,
  weekStart: T,
  goals: [],
  memo: "",
  retrospective: "",
  goalId,
  createdAt: T,
  updatedAt: T,
});

function respond(body: unknown, status = 200) {
  return Promise.resolve(
    new Response(JSON.stringify(body), {
      status,
      headers: { "content-type": "application/json" },
    })
  );
}

beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock);
  fetchMock.mockReset();
  useStore.setState({
    goals: [goal("g1"), goal("g2")],
    todos: [todo("t1", "g1"), todo("t2", "g2"), todo("t3")],
    plans: [plan("p1", "g1"), plan("p2", "g2")],
  });
});
afterEach(() => vi.unstubAllGlobals());

describe("deleteGoal", () => {
  it("clears goalId on cached todos and plans referencing the goal", async () => {
    fetchMock.mockReturnValueOnce(respond({ success: true }));
    expect(await useStore.getState().deleteGoal("g1")).toBe(true);
    const s = useStore.getState();
    expect(s.goals.map((g) => g._id)).toEqual(["g2"]);
    expect(s.todos.find((t) => t._id === "t1")?.goalId).toBeUndefined();
    expect(s.todos.find((t) => t._id === "t2")?.goalId).toBe("g2");
    expect(s.plans.find((p) => p._id === "p1")?.goalId).toBeUndefined();
    expect(s.plans.find((p) => p._id === "p2")?.goalId).toBe("g2");
  });

  it("leaves everything untouched when the API call fails", async () => {
    fetchMock.mockReturnValueOnce(respond({ error: "boom" }, 500));
    expect(await useStore.getState().deleteGoal("g1")).toBe(false);
    const s = useStore.getState();
    expect(s.goals).toHaveLength(2);
    expect(s.todos[0].goalId).toBe("g1");
    expect(s.plans[0].goalId).toBe("g1");
    expect(s.goalsError).toBe("boom");
  });
});

describe("validateGoalForm", () => {
  it("rejects empty or whitespace title", () => {
    expect(validateGoalForm({ title: "", description: "x" })).not.toBeNull();
    expect(validateGoalForm({ title: "   ", description: "" })).not.toBeNull();
  });
  it("accepts a title with empty description", () => {
    expect(validateGoalForm({ title: "A", description: "" })).toBeNull();
  });
});

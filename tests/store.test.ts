import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useStore } from "@/store";
import type { Goal, Todo, WeeklyPlan } from "@/types";

const fetchMock = vi.fn();

function ok(body: unknown, status = 200) {
  return Promise.resolve(
    new Response(JSON.stringify(body), {
      status,
      headers: { "content-type": "application/json" },
    })
  );
}
function fail(message: string, status = 400) {
  return ok({ error: message }, status);
}

const T = "2024-01-01T00:00:00.000Z";
const todo = (id: string, title = "t"): Todo => ({
  _id: id,
  title,
  status: "todo",
  priority: "medium",
  order: "a0",
  createdAt: T,
  updatedAt: T,
});
const goal = (id: string, title = "g"): Goal => ({
  _id: id,
  title,
  description: "",
  progress: 0,
  createdAt: T,
  updatedAt: T,
});
const plan = (id: string, done = false): WeeklyPlan => ({
  _id: id,
  weekStart: T,
  goals: [{ text: "a", done }],
  memo: "",
  retrospective: "",
  createdAt: T,
  updatedAt: T,
});

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
  useStore.setState({
    todos: [],
    todosLoading: false,
    todosError: null,
    plans: [],
    plansLoading: false,
    plansError: null,
    goals: [],
    goalsLoading: false,
    goalsError: null,
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("todoSlice", () => {
  it("fetchTodos loads items and sends query", async () => {
    fetchMock.mockReturnValueOnce(ok([todo("1"), todo("2")]));
    await useStore.getState().fetchTodos({ status: "todo" });
    const s = useStore.getState();
    expect(s.todos.map((t) => t._id)).toEqual(["1", "2"]);
    expect(s.todosLoading).toBe(false);
    expect(s.todosError).toBeNull();
    expect(fetchMock.mock.calls[0][0]).toBe("/api/todos?status=todo");
  });

  it("addTodo appends", async () => {
    useStore.setState({ todos: [todo("1")] });
    fetchMock.mockReturnValueOnce(ok(todo("2"), 201));
    const created = await useStore.getState().addTodo({ title: "t", order: "a1" });
    expect(created?._id).toBe("2");
    expect(useStore.getState().todos.map((t) => t._id)).toEqual(["1", "2"]);
    expect(fetchMock.mock.calls[0][1].method).toBe("POST");
  });

  it("updateTodo replaces the item via PATCH", async () => {
    useStore.setState({ todos: [todo("1"), todo("2")] });
    fetchMock.mockReturnValueOnce(ok({ ...todo("1"), status: "done" }));
    await useStore.getState().updateTodo("1", { status: "done" });
    const s = useStore.getState();
    expect(s.todos[0].status).toBe("done");
    expect(s.todos[1].status).toBe("todo");
    expect(fetchMock.mock.calls[0][0]).toBe("/api/todos/1");
    expect(fetchMock.mock.calls[0][1].method).toBe("PATCH");
  });

  it("deleteTodo removes the item", async () => {
    useStore.setState({ todos: [todo("1"), todo("2")] });
    fetchMock.mockReturnValueOnce(ok({ success: true }));
    expect(await useStore.getState().deleteTodo("1")).toBe(true);
    expect(useStore.getState().todos.map((t) => t._id)).toEqual(["2"]);
  });

  it("errors set todosError and leave items unchanged", async () => {
    const items = [todo("1")];
    useStore.setState({ todos: items });
    fetchMock.mockReturnValueOnce(fail("Invalid status"));
    await useStore.getState().fetchTodos();
    expect(useStore.getState().todosError).toBe("Invalid status");
    expect(useStore.getState().todosLoading).toBe(false);
    expect(useStore.getState().todos).toEqual(items);

    fetchMock.mockReturnValueOnce(fail("bad", 400));
    expect(await useStore.getState().addTodo({})).toBeNull();
    expect(useStore.getState().todosError).toBe("bad");

    fetchMock.mockReturnValueOnce(fail("Not found", 404));
    expect(await useStore.getState().updateTodo("1", { title: "x" })).toBeNull();
    expect(useStore.getState().todosError).toBe("Not found");

    fetchMock.mockReturnValueOnce(fail("Not found", 404));
    expect(await useStore.getState().deleteTodo("1")).toBe(false);
    expect(useStore.getState().todos).toEqual(items);
  });

  it("network failure sets error", async () => {
    fetchMock.mockRejectedValueOnce(new Error("offline"));
    await useStore.getState().fetchTodos();
    expect(useStore.getState().todosError).toBe("offline");
  });
});

describe("goalSlice", () => {
  it("fetch/add/update/delete update state", async () => {
    fetchMock.mockReturnValueOnce(ok([goal("1")]));
    await useStore.getState().fetchGoals();
    expect(useStore.getState().goals).toHaveLength(1);

    fetchMock.mockReturnValueOnce(ok(goal("2"), 201));
    await useStore.getState().addGoal({ title: "g" });
    expect(useStore.getState().goals.map((g) => g._id)).toEqual(["1", "2"]);

    fetchMock.mockReturnValueOnce(ok(goal("1", "renamed")));
    await useStore.getState().updateGoal("1", { title: "renamed" });
    expect(useStore.getState().goals[0].title).toBe("renamed");
    expect(fetchMock.mock.calls[2][1].method).toBe("PUT");

    fetchMock.mockReturnValueOnce(ok({ success: true }));
    await useStore.getState().deleteGoal("1");
    expect(useStore.getState().goals.map((g) => g._id)).toEqual(["2"]);
  });

  it("errors set goalsError and leave items unchanged", async () => {
    const items = [goal("1")];
    useStore.setState({ goals: items });
    fetchMock.mockReturnValueOnce(fail("boom", 500));
    await useStore.getState().fetchGoals();
    expect(useStore.getState().goalsError).toBe("boom");
    fetchMock.mockReturnValueOnce(fail("title required"));
    expect(await useStore.getState().addGoal({})).toBeNull();
    fetchMock.mockReturnValueOnce(fail("Not found", 404));
    expect(await useStore.getState().updateGoal("1", {})).toBeNull();
    fetchMock.mockReturnValueOnce(fail("Not found", 404));
    expect(await useStore.getState().deleteGoal("1")).toBe(false);
    expect(useStore.getState().goals).toEqual(items);
    expect(useStore.getState().goalsError).toBe("Not found");
  });
});

describe("weeklySlice", () => {
  it("fetch/add/update/delete update state", async () => {
    fetchMock.mockReturnValueOnce(ok([plan("1")]));
    await useStore.getState().fetchPlans("2024-01-01");
    expect(useStore.getState().plans).toHaveLength(1);
    expect(fetchMock.mock.calls[0][0]).toBe("/api/weekly?weekStart=2024-01-01");

    fetchMock.mockReturnValueOnce(ok(plan("2"), 201));
    await useStore.getState().addPlan({ weekStart: T });
    expect(useStore.getState().plans.map((p) => p._id)).toEqual(["2", "1"]);

    fetchMock.mockReturnValueOnce(ok({ ...plan("1"), memo: "m" }));
    await useStore.getState().updatePlan("1", { memo: "m" });
    expect(useStore.getState().plans.find((p) => p._id === "1")?.memo).toBe("m");

    fetchMock.mockReturnValueOnce(ok({ success: true }));
    await useStore.getState().deletePlan("2");
    expect(useStore.getState().plans.map((p) => p._id)).toEqual(["1"]);
  });

  it("toggleGoal PATCHes {index, done} and updates the plan", async () => {
    useStore.setState({ plans: [plan("1", false)] });
    fetchMock.mockReturnValueOnce(ok(plan("1", true)));
    await useStore.getState().toggleGoal("1", 0, true);
    expect(useStore.getState().plans[0].goals[0].done).toBe(true);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/weekly/1");
    expect(init.method).toBe("PATCH");
    expect(JSON.parse(init.body)).toEqual({ index: 0, done: true });
  });

  it("errors set plansError and leave items unchanged", async () => {
    const items = [plan("1", false)];
    useStore.setState({ plans: items });
    fetchMock.mockReturnValueOnce(fail("index out of range"));
    expect(await useStore.getState().toggleGoal("1", 9, true)).toBeNull();
    expect(useStore.getState().plansError).toBe("index out of range");
    fetchMock.mockReturnValueOnce(fail("Duplicate entry", 409));
    expect(await useStore.getState().addPlan({})).toBeNull();
    expect(useStore.getState().plansError).toBe("Duplicate entry");
    fetchMock.mockReturnValueOnce(fail("x", 500));
    await useStore.getState().fetchPlans();
    fetchMock.mockReturnValueOnce(fail("x", 404));
    expect(await useStore.getState().updatePlan("1", {})).toBeNull();
    fetchMock.mockReturnValueOnce(fail("x", 404));
    expect(await useStore.getState().deletePlan("1")).toBe(false);
    expect(useStore.getState().plans).toEqual(items);
  });
});

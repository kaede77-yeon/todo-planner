import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { computeMove } from "@/lib/kanban";
import { useStore } from "@/store";
import type { Todo, TodoStatus } from "@/types";

const T = "2024-01-01T00:00:00.000Z";
const mk = (id: string, status: TodoStatus, order: string): Todo => ({
  _id: id,
  title: id,
  status,
  priority: "medium",
  order,
  createdAt: T,
  updatedAt: T,
});

describe("computeMove", () => {
  const todos = [
    mk("a", "todo", "a0"),
    mk("b", "todo", "a1"),
    mk("c", "todo", "a2"),
    mk("d", "doing", "a0"),
  ];
  it("moves across columns to the start", () => {
    const r = computeMove({ todos, activeId: "a", overStatus: "doing", overIndex: 0 });
    expect(r.status).toBe("doing");
    expect(r.order < "a0").toBe(true);
  });
  it("reorders inside a column (active excluded)", () => {
    const r = computeMove({ todos, activeId: "a", overStatus: "todo", overIndex: 1 });
    expect(r.status).toBe("todo");
    expect(r.order > "a1" && r.order < "a2").toBe(true);
  });
  it("drops into empty column", () => {
    const r = computeMove({ todos, activeId: "a", overStatus: "done", overIndex: 0 });
    expect(r).toEqual({ status: "done", order: "a0" });
  });
  it("drops at end", () => {
    const r = computeMove({ todos, activeId: "a", overStatus: "todo", overIndex: 99 });
    expect(r.order > "a2").toBe(true);
  });
});

describe("moveTodo", () => {
  const fetchMock = vi.fn();
  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { "content-type": "application/json" },
    });
  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
    fetchMock.mockReset();
    useStore.setState({
      todos: [mk("a", "todo", "a0"), mk("b", "todo", "a1")],
      todosError: null,
    });
  });
  afterEach(() => vi.unstubAllGlobals());

  it("applies optimistically and PATCHes exactly once", async () => {
    let resolve: (r: Response) => void = () => {};
    fetchMock.mockReturnValue(new Promise<Response>((r) => (resolve = r)));
    const p = useStore.getState().moveTodo("a", "doing", "a5");
    const local = useStore.getState().todos.find((t) => t._id === "a");
    expect(local?.status).toBe("doing");
    expect(local?.order).toBe("a5");
    resolve(json(mk("a", "doing", "a5")));
    expect(await p).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/todos/a");
    expect(init.method).toBe("PATCH");
    expect(JSON.parse(init.body)).toEqual({ status: "doing", order: "a5" });
  });

  it("rolls back on failure and sets todosError", async () => {
    fetchMock.mockResolvedValue(json({ error: "boom" }, 500));
    const ok = await useStore.getState().moveTodo("a", "done", "a9");
    expect(ok).toBe(false);
    const a = useStore.getState().todos.find((t) => t._id === "a");
    expect(a?.status).toBe("todo");
    expect(a?.order).toBe("a0");
    expect(useStore.getState().todosError).toBe("boom");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});

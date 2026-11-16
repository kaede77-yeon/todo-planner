import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useStore } from "@/store";
import type { Todo } from "@/types";

const base: Todo = {
  _id: "t1",
  title: "t",
  status: "todo",
  priority: "medium",
  order: "a0",
  dueDate: "2026-11-01T00:00:00.000Z",
  goalId: "g1",
  weeklyPlanId: "p1",
  createdAt: "",
  updatedAt: "",
};

describe("updateTodo can clear optional fields with null", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
    useStore.setState({ todos: [base] });
  });
  afterEach(() => vi.unstubAllGlobals());

  it("sends null for cleared dueDate/goalId/weeklyPlanId and stores the response", async () => {
    const cleared: Todo = { ...base };
    delete cleared.dueDate;
    delete cleared.goalId;
    delete cleared.weeklyPlanId;
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => cleared,
    });

    const result = await useStore
      .getState()
      .updateTodo("t1", { dueDate: null, goalId: null, weeklyPlanId: null });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const init = fetchMock.mock.calls[0][1] as { body: string };
    expect(JSON.parse(init.body)).toEqual({
      dueDate: null,
      goalId: null,
      weeklyPlanId: null,
    });
    expect(result).toEqual(cleared);
    expect(useStore.getState().todos[0].dueDate).toBeUndefined();
  });
});

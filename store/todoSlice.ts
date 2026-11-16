import type { StateCreator } from "zustand";
import type { Todo, TodoStatus } from "@/types";
import { errorMessage, request } from "./api";
import type { AppState } from "./types";

export type TodoInput = Partial<Omit<Todo, "_id" | "createdAt" | "updatedAt">>;

/**
 * Partial update where `null` explicitly clears an optional field
 * (the API accepts null for dueDate / weeklyPlanId / goalId / dayOfWeek).
 */
export type TodoPatch = { [K in keyof TodoInput]: TodoInput[K] | null };

export interface TodoSlice {
  todos: Todo[];
  todosLoading: boolean;
  todosError: string | null;
  fetchTodos: (query?: Record<string, string>) => Promise<void>;
  addTodo: (input: TodoInput) => Promise<Todo | null>;
  /** Reusable partial update (PATCH); returns the updated todo or null on error. */
  updateTodo: (id: string, patch: TodoPatch) => Promise<Todo | null>;
  deleteTodo: (id: string) => Promise<boolean>;
  /** Optimistic move; single PATCH, rolls back on failure. */
  moveTodo: (
    id: string,
    status: TodoStatus,
    order: string
  ) => Promise<boolean>;
}

export const createTodoSlice: StateCreator<
  AppState,
  [["zustand/devtools", never]],
  [],
  TodoSlice
> = (set, get) => ({
  todos: [],
  todosLoading: false,
  todosError: null,
  fetchTodos: async (query) => {
    set({ todosLoading: true, todosError: null }, false, "todos/fetch");
    try {
      const qs = query ? `?${new URLSearchParams(query).toString()}` : "";
      const todos = await request<Todo[]>(`/api/todos${qs}`);
      set({ todos, todosLoading: false }, false, "todos/fetch/ok");
    } catch (err) {
      set(
        { todosLoading: false, todosError: errorMessage(err) },
        false,
        "todos/fetch/err"
      );
    }
  },
  addTodo: async (input) => {
    set({ todosError: null }, false, "todos/add");
    try {
      const todo = await request<Todo>("/api/todos", {
        method: "POST",
        body: input,
      });
      set((s) => ({ todos: [...s.todos, todo] }), false, "todos/add/ok");
      return todo;
    } catch (err) {
      set({ todosError: errorMessage(err) }, false, "todos/add/err");
      return null;
    }
  },
  updateTodo: async (id, patch) => {
    set({ todosError: null }, false, "todos/update");
    try {
      const todo = await request<Todo>(`/api/todos/${id}`, {
        method: "PATCH",
        body: patch,
      });
      set(
        (s) => ({ todos: s.todos.map((t) => (t._id === id ? todo : t)) }),
        false,
        "todos/update/ok"
      );
      return todo;
    } catch (err) {
      set({ todosError: errorMessage(err) }, false, "todos/update/err");
      return null;
    }
  },
  deleteTodo: async (id) => {
    set({ todosError: null }, false, "todos/delete");
    try {
      await request<{ success: boolean }>(`/api/todos/${id}`, {
        method: "DELETE",
      });
      set(
        (s) => ({ todos: s.todos.filter((t) => t._id !== id) }),
        false,
        "todos/delete/ok"
      );
      return true;
    } catch (err) {
      set({ todosError: errorMessage(err) }, false, "todos/delete/err");
      return false;
    }
  },
  moveTodo: async (id, status, order) => {
    const prev = get().todos.find((t) => t._id === id);
    if (!prev) return false;
    set(
      (s) => ({
        todosError: null,
        todos: s.todos.map((t) => (t._id === id ? { ...t, status, order } : t)),
      }),
      false,
      "todos/move"
    );
    try {
      await request<Todo>(`/api/todos/${id}`, {
        method: "PATCH",
        body: { status, order },
      });
      return true;
    } catch (err) {
      set(
        (s) => ({
          todosError: errorMessage(err),
          todos: s.todos.map((t) =>
            t._id === id ? { ...t, status: prev.status, order: prev.order } : t
          ),
        }),
        false,
        "todos/move/err"
      );
      return false;
    }
  },
});

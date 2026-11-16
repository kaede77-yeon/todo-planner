"use client";

import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import type { Todo, TodoStatus } from "@/types";
import TodoCard, { STATUS_LABEL } from "./TodoCard";

interface Props {
  status: TodoStatus;
  todos: Todo[];
  onOpen: (todo: Todo) => void;
  onStatusChange: (todo: Todo, status: TodoStatus) => void;
  onAdd: (status: TodoStatus) => void;
}

const columnId = (status: TodoStatus) => `column:${status}`;

export default function KanbanColumn({
  status,
  todos,
  onOpen,
  onStatusChange,
  onAdd,
}: Props) {
  const { setNodeRef, isOver } = useDroppable({
    id: columnId(status),
    data: { status },
  });

  return (
    <section
      aria-label={STATUS_LABEL[status]}
      className={`flex min-h-[12rem] flex-col rounded-lg bg-gray-100 p-3 ${
        isOver ? "ring-2 ring-blue-300" : ""
      }`}
    >
      <header className="mb-3 flex items-center justify-between">
        <h2 className="font-semibold">
          {STATUS_LABEL[status]}{" "}
          <span className="text-sm text-gray-500">({todos.length})</span>
        </h2>
        <button
          type="button"
          onClick={() => onAdd(status)}
          className="rounded px-2 py-1 text-sm text-blue-600 hover:bg-white"
        >
          + 추가
        </button>
      </header>
      <SortableContext
        items={todos.map((t) => t._id)}
        strategy={verticalListSortingStrategy}
      >
        <ul ref={setNodeRef} className="flex flex-1 flex-col gap-2">
          {todos.map((t) => (
            <TodoCard
              key={t._id}
              todo={t}
              onOpen={onOpen}
              onStatusChange={onStatusChange}
            />
          ))}
        </ul>
      </SortableContext>
    </section>
  );
}

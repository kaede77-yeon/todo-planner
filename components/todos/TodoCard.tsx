"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Todo, TodoStatus } from "@/types";
import { STATUSES, isOverdue } from "@/lib/kanban";
import PriorityBadge from "@/components/shared/PriorityBadge";

export const STATUS_LABEL: Record<TodoStatus, string> = {
  todo: "할 일",
  doing: "진행 중",
  done: "완료",
};

interface Props {
  todo: Todo;
  onOpen: (todo: Todo) => void;
  onStatusChange: (todo: Todo, status: TodoStatus) => void;
  overlay?: boolean;
}

export function CardBody({ todo }: { todo: Todo }) {
  return (
    <>
      <p className="font-medium">{todo.title}</p>
      {todo.description ? (
        <p className="mt-1 line-clamp-2 text-sm text-body">
          {todo.description}
        </p>
      ) : null}
      <p className="mt-2 flex items-center gap-2 text-xs text-muted">
        <PriorityBadge priority={todo.priority} />
        {todo.dueDate ? (
          <span
            className={
              isOverdue(todo, new Date()) ? "font-medium text-error" : ""
            }
          >
            마감: {todo.dueDate.slice(0, 10)}
          </span>
        ) : null}
      </p>
    </>
  );
}

export default function TodoCard({ todo, onOpen, onStatusChange }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: todo._id, data: { status: todo.status } });

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`rounded-card border bg-canvas p-3 transition-shadow hover:shadow-float ${
        isDragging ? "opacity-40" : ""
      }`}
    >
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab touch-none"
        aria-label={`${todo.title} 드래그`}
      >
        <CardBody todo={todo} />
      </div>
      <div className="mt-2 flex items-center justify-between gap-2">
        <label className="text-xs text-muted">
          <span className="sr-only">{todo.title} 상태 변경</span>
          <select
            value={todo.status}
            onChange={(e) => {
              const next = STATUSES.find((s) => s === e.target.value);
              if (next) onStatusChange(todo, next);
            }}
            className="rounded-sm border px-1 py-0.5 text-xs"
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABEL[s]}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          onClick={() => onOpen(todo)}
          className="text-xs text-ink underline underline-offset-2"
        >
          편집
        </button>
      </div>
    </li>
  );
}

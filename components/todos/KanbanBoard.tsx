"use client";

import { useEffect, useMemo, useState } from "react";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { useStore } from "@/store";
import { computeMove, sortedByOrder, sortedForColumn, STATUSES } from "@/lib/kanban";
import { orderForInsert } from "@/lib/fractionalIndex";
import type { Todo, TodoStatus } from "@/types";
import KanbanColumn from "./KanbanColumn";
import { CardBody } from "./TodoCard";
import TodoModal, { type ModalTarget } from "./TodoModal";

export default function KanbanBoard() {
  const todos = useStore((s) => s.todos);
  const todosError = useStore((s) => s.todosError);
  const fetchTodos = useStore((s) => s.fetchTodos);
  const fetchPlans = useStore((s) => s.fetchPlans);
  const fetchGoals = useStore((s) => s.fetchGoals);
  const moveTodo = useStore((s) => s.moveTodo);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [target, setTarget] = useState<ModalTarget | null>(null);

  useEffect(() => {
    void fetchTodos();
    void fetchPlans();
    void fetchGoals();
  }, [fetchTodos, fetchPlans, fetchGoals]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const columns = useMemo(
    () => STATUSES.map((s) => [s, sortedForColumn(todos, s)] as const),
    [todos]
  );
  const activeTodo = todos.find((t) => t._id === activeId) ?? null;

  const onDragStart = (e: DragStartEvent) => setActiveId(String(e.active.id));

  const onDragEnd = (e: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = e;
    if (!over) return;
    const id = String(active.id);
    const current = todos.find((t) => t._id === id);
    if (!current) return;
    const overId = String(over.id);
    const overTodo = todos.find((t) => t._id === overId);
    const overStatus: TodoStatus | undefined = overTodo
      ? overTodo.status
      : STATUSES.find((s) => `column:${s}` === overId);
    if (!overStatus) return;

    const column = sortedForColumn(todos, overStatus);
    let overIndex = column.filter((t) => t._id !== id).length;
    if (overTodo) {
      if (overTodo._id === id) return;
      const without = column.filter((t) => t._id !== id);
      const idx = without.findIndex((t) => t._id === overTodo._id);
      const activeBefore =
        current.status === overStatus &&
        column.findIndex((t) => t._id === id) <
          column.findIndex((t) => t._id === overTodo._id);
      overIndex = activeBefore ? idx + 1 : idx;
    }
    const move = computeMove({ todos, activeId: id, overStatus, overIndex });
    if (move.status === current.status && move.order === current.order) return;
    void moveTodo(id, move.status, move.order);
  };

  const changeStatus = (todo: Todo, status: TodoStatus) => {
    if (status === todo.status) return;
    const order = orderForInsert(
      sortedByOrder(todos, status).map((t) => t.order),
      Infinity
    );
    void moveTodo(todo._id, status, order);
  };

  return (
    <div>
      {todosError ? (
        <p role="alert" className="mb-3 rounded bg-red-50 p-2 text-sm text-red-700">
          {todosError}
        </p>
      ) : null}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        onDragCancel={() => setActiveId(null)}
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {columns.map(([status, items]) => (
            <KanbanColumn
              key={status}
              status={status}
              todos={items}
              onOpen={(todo) => setTarget({ mode: "edit", todo })}
              onStatusChange={changeStatus}
              onAdd={(s) => setTarget({ mode: "create", status: s })}
            />
          ))}
        </div>
        <DragOverlay>
          {activeTodo ? (
            <div className="rounded border bg-white p-3 shadow-lg">
              <CardBody todo={activeTodo} />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
      <TodoModal target={target} onClose={() => setTarget(null)} />
    </div>
  );
}

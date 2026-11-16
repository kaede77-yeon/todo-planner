"use client";

import Modal from "@/components/shared/Modal";
import { useStore } from "@/store";
import type { TodoPatch } from "@/store/todoSlice";
import { orderForInsert } from "@/lib/fractionalIndex";
import { sortedByOrder } from "@/lib/kanban";
import type { Todo, TodoStatus } from "@/types";
import TodoForm, { type TodoFormValues } from "./TodoForm";

export type ModalTarget =
  | { mode: "create"; status: TodoStatus }
  | { mode: "edit"; todo: Todo };

interface Props {
  target: ModalTarget | null;
  onClose: () => void;
}

export default function TodoModal({ target, onClose }: Props) {
  const addTodo = useStore((s) => s.addTodo);
  const updateTodo = useStore((s) => s.updateTodo);
  const deleteTodo = useStore((s) => s.deleteTodo);

  const submit = async (v: TodoFormValues) => {
    if (!target) return;
    const { todos } = useStore.getState();
    if (target.mode === "create") {
      const order = orderForInsert(
        sortedByOrder(todos, v.status).map((t) => t.order),
        Infinity
      );
      await addTodo({ ...v, order });
    } else {
      const { todo } = target;
      // A cleared form field must be sent as null, otherwise the old value stays.
      const patch: TodoPatch = {
        ...v,
        dueDate: v.dueDate ?? null,
        weeklyPlanId: v.weeklyPlanId ?? null,
        goalId: v.goalId ?? null,
      };
      // Status/priority decide which sort group the card lives in: re-key it at the
      // end of its new group so keys never collide with other cards in that group.
      if (v.status !== todo.status || v.priority !== todo.priority) {
        patch.order = orderForInsert(
          sortedByOrder(todos, v.status)
            .filter((t) => t._id !== todo._id && t.priority === v.priority)
            .map((t) => t.order),
          Infinity
        );
      }
      const saved = await updateTodo(todo._id, patch);
      if (!saved) return; // keep the modal open so the user's input is not lost
    }
    onClose();
  };

  return (
    <Modal
      open={target !== null}
      title={target?.mode === "edit" ? "할 일 수정" : "할 일 추가"}
      onClose={onClose}
    >
      {target ? (
        <TodoForm
          key={target.mode === "edit" ? target.todo._id : `new-${target.status}`}
          initial={target.mode === "edit" ? target.todo : undefined}
          defaultStatus={
            target.mode === "edit" ? target.todo.status : target.status
          }
          onSubmit={submit}
          onCancel={onClose}
          onDelete={
            target.mode === "edit"
              ? async () => {
                  await deleteTodo(target.todo._id);
                  onClose();
                }
              : undefined
          }
        />
      ) : null}
    </Modal>
  );
}

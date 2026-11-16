"use client";

import type { Goal, Todo } from "@/types";
import GoalProgress from "./GoalProgress";

interface GoalCardProps {
  goal: Goal;
  todos: Todo[];
  onEdit: (goal: Goal) => void;
  onDelete: (goal: Goal) => void;
}

export default function GoalCard({ goal, todos, onEdit, onDelete }: GoalCardProps) {
  return (
    <li className="rounded-card border border-hairline bg-canvas p-4 shadow-sm">
      <h2 className="text-title-md">{goal.title}</h2>
      {goal.description && (
        <p className="mt-1 whitespace-pre-wrap text-sm text-body">
          {goal.description}
        </p>
      )}
      <div className="mt-3">
        <GoalProgress todos={todos} goalId={goal._id} />
      </div>
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={() => onEdit(goal)}
          className="rounded-sm px-2 py-1 text-sm text-ink underline underline-offset-2 hover:bg-surface-soft"
        >
          수정
        </button>
        <button
          type="button"
          onClick={() => onDelete(goal)}
          className="rounded-sm px-2 py-1 text-sm text-error hover:bg-surface-soft"
        >
          삭제
        </button>
      </div>
    </li>
  );
}

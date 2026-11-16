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
    <li className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <h2 className="font-semibold">{goal.title}</h2>
      {goal.description && (
        <p className="mt-1 whitespace-pre-wrap text-sm text-gray-600">
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
          className="rounded-md px-2 py-1 text-sm text-blue-600 hover:bg-blue-50"
        >
          수정
        </button>
        <button
          type="button"
          onClick={() => onDelete(goal)}
          className="rounded-md px-2 py-1 text-sm text-red-600 hover:bg-red-50"
        >
          삭제
        </button>
      </div>
    </li>
  );
}

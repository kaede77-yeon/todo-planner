"use client";

import type { WeeklyGoal } from "@/types";

interface Props {
  goal: WeeklyGoal;
  onToggle: (done: boolean) => void;
}

export default function WeeklyGoalItem({ goal, onToggle }: Props) {
  return (
    <label className="flex items-center gap-2 py-1">
      <input
        type="checkbox"
        checked={goal.done}
        onChange={(e) => onToggle(e.target.checked)}
      />
      <span className={goal.done ? "text-gray-400 line-through" : ""}>
        {goal.text}
      </span>
    </label>
  );
}

"use client";

import { useState } from "react";
import type { Goal, WeeklyGoal } from "@/types";
import { MAX_WEEKLY_GOALS, canAddGoal } from "@/lib/utils";

export interface WeeklyPlanFormValues {
  goals: WeeklyGoal[];
  memo: string;
  goalId?: string | null;
}

interface Props {
  initial?: WeeklyPlanFormValues;
  yearGoals: Goal[];
  submitLabel: string;
  onSubmit: (values: WeeklyPlanFormValues) => Promise<void> | void;
}

export default function WeeklyPlanForm({
  initial,
  yearGoals,
  submitLabel,
  onSubmit,
}: Props) {
  const [goals, setGoals] = useState<WeeklyGoal[]>(initial?.goals ?? []);
  const [memo, setMemo] = useState(initial?.memo ?? "");
  const [goalId, setGoalId] = useState(initial?.goalId ?? "");
  const [limitMsg, setLimitMsg] = useState("");

  const addGoal = () => {
    if (!canAddGoal(goals.length)) {
      setLimitMsg(
        `주간 목표는 최대 ${MAX_WEEKLY_GOALS}개까지 추가할 수 있습니다.`
      );
      return;
    }
    setLimitMsg("");
    setGoals([...goals, { text: "", done: false }]);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = goals
      .map((g) => ({ ...g, text: g.text.trim() }))
      .filter((g) => g.text !== "");
    void onSubmit({ goals: cleaned, memo, goalId: goalId || null });
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <div className="mb-1 text-sm font-medium">
          주간 목표 ({goals.length}/{MAX_WEEKLY_GOALS})
        </div>
        <ul className="space-y-2">
          {goals.map((g, i) => (
            <li key={i} className="flex gap-2">
              <input
                aria-label={`주간 목표 ${i + 1}`}
                className="flex-1 rounded-sm border px-2 py-1"
                value={g.text}
                onChange={(e) =>
                  setGoals(
                    goals.map((x, j) =>
                      j === i ? { ...x, text: e.target.value } : x
                    )
                  )
                }
              />
              <button
                type="button"
                aria-label={`목표 ${i + 1} 삭제`}
                className="rounded-sm border px-2"
                onClick={() => {
                  setLimitMsg("");
                  setGoals(goals.filter((_, j) => j !== i));
                }}
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
        <button
          type="button"
          onClick={addGoal}
          className="mt-2 rounded-sm border px-3 py-1 text-sm"
        >
          + 목표 추가
        </button>
        {limitMsg && (
          <p role="alert" className="mt-1 text-sm text-error">
            {limitMsg}
          </p>
        )}
      </div>
      <label className="block text-sm">
        <span className="mb-1 block font-medium">메모</span>
        <textarea
          className="w-full rounded-sm border px-2 py-1"
          rows={3}
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
        />
      </label>
      <label className="block text-sm">
        <span className="mb-1 block font-medium">1년 목표 연결 (선택)</span>
        <select
          className="w-full rounded-sm border px-2 py-1"
          value={goalId}
          onChange={(e) => setGoalId(e.target.value)}
        >
          <option value="">연결 안 함</option>
          {yearGoals.map((g) => (
            <option key={g._id} value={g._id}>
              {g.title}
            </option>
          ))}
        </select>
      </label>
      <button
        type="submit"
        className="rounded-sm bg-primary px-4 py-2 text-white"
      >
        {submitLabel}
      </button>
    </form>
  );
}

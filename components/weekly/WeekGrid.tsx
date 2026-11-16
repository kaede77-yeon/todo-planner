"use client";

import { useState } from "react";
import { generateKeyBetween } from "fractional-indexing";
import type { Todo } from "@/types";
import {
  DAY_LABELS,
  WEEK_DAY_ORDER,
  groupTodosByDay,
  lastOrder,
} from "@/lib/utils";

interface Props {
  planId: string;
  todos: Todo[];
  onCreate: (
    input: Pick<Todo, "title" | "order" | "weeklyPlanId" | "dayOfWeek">
  ) => Promise<unknown>;
  onAssign: (todoId: string, day: number) => Promise<unknown>;
  onUnassign: (todoId: string) => Promise<unknown>;
}

export default function WeekGrid({
  planId,
  todos,
  onCreate,
  onAssign,
  onUnassign,
}: Props) {
  const [activeDay, setActiveDay] = useState<number | null>(null);
  const [title, setTitle] = useState("");
  const groups = groupTodosByDay(todos, planId);
  const unscheduled = todos.filter(
    (t) => t.status !== "done" && typeof t.dayOfWeek !== "number"
  );

  const create = async (e: React.FormEvent, day: number) => {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;
    await onCreate({
      title: trimmed,
      order: generateKeyBetween(lastOrder(todos, "todo"), null),
      weeklyPlanId: planId,
      dayOfWeek: day,
    });
    setTitle("");
    setActiveDay(null);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-7 gap-2" data-testid="week-grid">
        {WEEK_DAY_ORDER.map((day) => (
          <div key={day} className="min-h-32 rounded border p-2">
            <button
              type="button"
              aria-label={`${DAY_LABELS[day]}요일 할일 추가`}
              onClick={() => {
                setActiveDay(activeDay === day ? null : day);
                setTitle("");
              }}
              className="mb-2 w-full rounded bg-gray-100 py-1 text-sm font-medium hover:bg-gray-200"
            >
              {DAY_LABELS[day]}
            </button>
            {activeDay === day && (
              <form
                onSubmit={(e) => void create(e, day)}
                className="mb-2 flex flex-col gap-1"
              >
                <input
                  autoFocus
                  aria-label="할일 제목"
                  className="rounded border px-1 py-0.5 text-sm"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
                <button
                  type="submit"
                  className="rounded bg-blue-600 px-2 py-0.5 text-xs text-white"
                >
                  추가
                </button>
              </form>
            )}
            <ul className="space-y-1">
              {groups[day].map((t) => (
                <li key={t._id} className="rounded bg-blue-50 p-1 text-sm">
                  <div>{t.title}</div>
                  <button
                    type="button"
                    className="text-xs text-gray-500 underline"
                    onClick={() => void onUnassign(t._id)}
                  >
                    배치 해제
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div>
        <h3 className="mb-1 text-sm font-medium">미배치 할일</h3>
        {unscheduled.length === 0 ? (
          <p className="text-sm text-gray-500">미배치 할일이 없습니다.</p>
        ) : (
          <ul className="space-y-1">
            {unscheduled.map((t) => (
              <li key={t._id} className="flex items-center gap-2 text-sm">
                <span>{t.title}</span>
                <select
                  aria-label={`${t.title} 요일 배치`}
                  className="rounded border px-1"
                  value=""
                  onChange={(e) => {
                    if (e.target.value !== "")
                      void onAssign(t._id, Number(e.target.value));
                  }}
                >
                  <option value="">요일 선택</option>
                  {WEEK_DAY_ORDER.map((d) => (
                    <option key={d} value={d}>
                      {DAY_LABELS[d]}
                    </option>
                  ))}
                </select>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

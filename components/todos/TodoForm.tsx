"use client";

import { useState, type FormEvent } from "react";
import type { Todo, TodoPriority, TodoStatus } from "@/types";
import { useStore } from "@/store";
import { STATUSES, localDateString } from "@/lib/kanban";
import { STATUS_LABEL } from "./TodoCard";

const PRIORITIES: { value: TodoPriority; label: string }[] = [
  { value: "high", label: "높음" },
  { value: "medium", label: "보통" },
  { value: "low", label: "낮음" },
];

export interface TodoFormValues {
  title: string;
  description: string;
  status: TodoStatus;
  priority: TodoPriority;
  dueDate?: string;
  weeklyPlanId?: string;
  goalId?: string;
}

interface Props {
  initial?: Todo;
  defaultStatus: TodoStatus;
  onSubmit: (values: TodoFormValues) => void;
  onCancel: () => void;
  onDelete?: () => void;
}

export default function TodoForm({
  initial,
  defaultStatus,
  onSubmit,
  onCancel,
  onDelete,
}: Props) {
  const plans = useStore((s) => s.plans);
  const goals = useStore((s) => s.goals);
  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [status, setStatus] = useState<TodoStatus>(
    initial?.status ?? defaultStatus
  );
  const [priority, setPriority] = useState<TodoPriority>(
    initial?.priority ?? "medium"
  );
  const [dueDate, setDueDate] = useState(initial?.dueDate?.slice(0, 10) ?? "");
  const [weeklyPlanId, setPlan] = useState(initial?.weeklyPlanId ?? "");
  const [goalId, setGoal] = useState(initial?.goalId ?? "");
  const [error, setError] = useState<string | null>(null);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("제목은 필수입니다");
      return;
    }
    onSubmit({
      title: title.trim(),
      description,
      status,
      priority,
      dueDate: dueDate || undefined,
      weeklyPlanId: weeklyPlanId || undefined,
      goalId: goalId || undefined,
    });
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-3">
      <label className="flex flex-col gap-1 text-sm">
        제목 *
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="rounded border px-2 py-1"
          autoFocus
        />
      </label>
      {error ? (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      ) : null}
      <label className="flex flex-col gap-1 text-sm">
        설명
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="rounded border px-2 py-1"
          rows={3}
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        상태
        <select
          value={status}
          onChange={(e) => {
            const next = STATUSES.find((s) => s === e.target.value);
            if (next) setStatus(next);
          }}
          className="rounded border px-2 py-1"
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABEL[s]}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-sm">
        우선순위
        <select
          value={priority}
          onChange={(e) => {
            const next = PRIORITIES.find((p) => p.value === e.target.value);
            if (next) setPriority(next.value);
          }}
          className="rounded border px-2 py-1"
        >
          {PRIORITIES.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-sm">
        마감일
        <input
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          className="rounded border px-2 py-1"
        />
      </label>
      {dueDate && dueDate < localDateString(new Date()) ? (
        <p role="status" className="text-sm text-amber-700">
          오늘 이전 날짜입니다.
        </p>
      ) : null}
      <label className="flex flex-col gap-1 text-sm">
        주간 계획
        <select
          value={weeklyPlanId}
          onChange={(e) => setPlan(e.target.value)}
          className="rounded border px-2 py-1"
        >
          <option value="">연결 안 함</option>
          {plans.map((p) => (
            <option key={p._id} value={p._id}>
              {p.weekStart.slice(0, 10)}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-sm">
        목표
        <select
          value={goalId}
          onChange={(e) => setGoal(e.target.value)}
          className="rounded border px-2 py-1"
        >
          <option value="">연결 안 함</option>
          {goals.map((g) => (
            <option key={g._id} value={g._id}>
              {g.title}
            </option>
          ))}
        </select>
      </label>
      <div className="mt-2 flex justify-between">
        {onDelete ? (
          <button
            type="button"
            onClick={onDelete}
            className="rounded px-3 py-1 text-sm text-red-600 hover:bg-red-50"
          >
            삭제
          </button>
        ) : (
          <span />
        )}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded px-3 py-1 text-sm hover:bg-gray-100"
          >
            취소
          </button>
          <button
            type="submit"
            className="rounded bg-blue-600 px-3 py-1 text-sm text-white"
          >
            저장
          </button>
        </div>
      </div>
    </form>
  );
}

"use client";

import { useState, type FormEvent } from "react";
import type { Goal } from "@/types";
import { validateGoalForm } from "./validate";

interface GoalFormProps {
  goal?: Goal;
  onSubmit: (values: { title: string; description: string }) => Promise<boolean>;
  onCancel: () => void;
}

export default function GoalForm({ goal, onSubmit, onCancel }: GoalFormProps) {
  const [title, setTitle] = useState(goal?.title ?? "");
  const [description, setDescription] = useState(goal?.description ?? "");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const values = { title: title.trim(), description: description.trim() };
    const invalid = validateGoalForm(values);
    if (invalid) {
      setError(invalid);
      return;
    }
    setError(null);
    setSaving(true);
    const ok = await onSubmit(values);
    setSaving(false);
    if (!ok) setError("저장에 실패했습니다.");
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <div>
        <label htmlFor="goal-title" className="mb-1 block text-sm font-medium">
          제목 <span className="text-error">*</span>
        </label>
        <input
          id="goal-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          aria-invalid={error !== null}
          className="w-full rounded-sm border border-hairline px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label htmlFor="goal-desc" className="mb-1 block text-sm font-medium">
          설명
        </label>
        <textarea
          id="goal-desc"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="w-full rounded-sm border border-hairline px-3 py-2 text-sm"
        />
      </div>
      {error && (
        <p role="alert" className="text-sm text-error">
          {error}
        </p>
      )}
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-sm px-3 py-2 text-sm text-ink hover:bg-surface-soft"
        >
          취소
        </button>
        <button
          type="submit"
          disabled={saving}
          className="rounded-sm bg-primary px-3 py-2 text-sm text-white hover:bg-primary-active disabled:opacity-50"
        >
          {goal ? "저장" : "추가"}
        </button>
      </div>
    </form>
  );
}

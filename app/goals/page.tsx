"use client";

import { useEffect, useState } from "react";
import type { Goal } from "@/types";
import { useStore } from "@/store";
import GoalCard from "@/components/goals/GoalCard";
import GoalForm from "@/components/goals/GoalForm";
import Modal from "@/components/shared/Modal";
import ConfirmDialog from "@/components/shared/ConfirmDialog";

export default function GoalsPage() {
  const goals = useStore((s) => s.goals);
  const loading = useStore((s) => s.goalsLoading);
  const error = useStore((s) => s.goalsError);
  const todos = useStore((s) => s.todos);
  const fetchGoals = useStore((s) => s.fetchGoals);
  const fetchTodos = useStore((s) => s.fetchTodos);
  const addGoal = useStore((s) => s.addGoal);
  const updateGoal = useStore((s) => s.updateGoal);
  const deleteGoal = useStore((s) => s.deleteGoal);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Goal | undefined>();
  const [deleting, setDeleting] = useState<Goal | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  useEffect(() => {
    void fetchGoals();
    void fetchTodos();
  }, [fetchGoals, fetchTodos]);

  function openNew() {
    setEditing(undefined);
    setFormOpen(true);
  }
  function openEdit(goal: Goal) {
    setEditing(goal);
    setFormOpen(true);
  }
  function closeForm() {
    setFormOpen(false);
    setEditing(undefined);
  }

  async function submit(values: { title: string; description: string }) {
    const result = editing
      ? await updateGoal(editing._id, values)
      : await addGoal(values);
    if (result) closeForm();
    return result !== null;
  }

  async function confirmDelete() {
    if (!deleting) return;
    setDeleteBusy(true);
    const ok = await deleteGoal(deleting._id);
    setDeleteBusy(false);
    if (ok) setDeleting(null);
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">목표</h1>
        <button
          type="button"
          onClick={openNew}
          className="rounded-md bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-700"
        >
          새 목표
        </button>
      </div>

      {error && (
        <div
          role="alert"
          className="mt-4 flex items-center justify-between rounded-md bg-red-50 p-3 text-sm text-red-700"
        >
          <span>{error}</span>
          <button
            type="button"
            onClick={() => void fetchGoals()}
            className="underline"
          >
            다시 시도
          </button>
        </div>
      )}

      {loading && goals.length === 0 ? (
        <p className="mt-6 text-sm text-gray-500">불러오는 중...</p>
      ) : goals.length === 0 && !error ? (
        <p className="mt-6 text-sm text-gray-500">
          아직 목표가 없습니다. &quot;새 목표&quot;로 1년 목표를 추가해보세요.
        </p>
      ) : (
        <ul className="mt-6 grid gap-3 sm:grid-cols-2">
          {goals.map((g) => (
            <GoalCard
              key={g._id}
              goal={g}
              todos={todos}
              onEdit={openEdit}
              onDelete={setDeleting}
            />
          ))}
        </ul>
      )}

      <Modal
        open={formOpen}
        title={editing ? "목표 수정" : "새 목표"}
        onClose={closeForm}
      >
        <GoalForm
          key={editing?._id ?? "new"}
          goal={editing}
          onSubmit={submit}
          onCancel={closeForm}
        />
      </Modal>

      <ConfirmDialog
        open={deleting !== null}
        title="목표 삭제"
        message={`"${deleting?.title ?? ""}" 목표를 삭제할까요? 연결된 할 일과 주간 계획은 유지되며 목표 연결만 해제됩니다.`}
        confirmLabel="삭제"
        busy={deleteBusy}
        onConfirm={() => void confirmDelete()}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
}

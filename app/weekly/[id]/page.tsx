"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useStore } from "@/store";
import { formatWeekRange } from "@/lib/utils";
import ProgressBar from "@/components/shared/ProgressBar";
import { weeklyProgress } from "@/lib/progress";
import Modal from "@/components/shared/Modal";
import WeeklyGoalItem from "@/components/weekly/WeeklyGoalItem";
import WeeklyPlanForm from "@/components/weekly/WeeklyPlanForm";
import WeekGrid from "@/components/weekly/WeekGrid";

export default function WeeklyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const plan = useStore((s) => s.plans.find((p) => p._id === id));
  const plansLoading = useStore((s) => s.plansLoading);
  const error = useStore((s) => s.plansError);
  const todos = useStore((s) => s.todos);
  const goals = useStore((s) => s.goals);
  const fetchPlans = useStore((s) => s.fetchPlans);
  const fetchTodos = useStore((s) => s.fetchTodos);
  const fetchGoals = useStore((s) => s.fetchGoals);
  const updatePlan = useStore((s) => s.updatePlan);
  const toggleGoal = useStore((s) => s.toggleGoal);
  const addTodo = useStore((s) => s.addTodo);
  const updateTodo = useStore((s) => s.updateTodo);
  const [editing, setEditing] = useState(false);
  const [memo, setMemo] = useState<string | null>(null);
  const [retro, setRetro] = useState<string | null>(null);
  const [retroSaved, setRetroSaved] = useState(false);

  useEffect(() => {
    void fetchPlans();
    void fetchTodos();
    void fetchGoals();
  }, [fetchPlans, fetchTodos, fetchGoals]);

  if (!plan) {
    return (
      <div>
        <Link href="/weekly" className="text-ink underline underline-offset-2">
          ← 목록
        </Link>
        <p className="mt-2">
          {plansLoading ? "불러오는 중..." : "주간 계획을 찾을 수 없습니다."}
        </p>
      </div>
    );
  }

  const memoValue = memo ?? plan.memo;
  const saveMemo = async () => {
    if (memo !== null && memo !== plan.memo) {
      await updatePlan(plan._id, { memo });
    }
    setMemo(null);
  };

  const retroValue = retro ?? plan.retrospective;
  const saveRetro = async () => {
    if (retro === null || retro === plan.retrospective) return;
    const saved = await updatePlan(plan._id, { retrospective: retro });
    if (saved) {
      setRetro(null);
      setRetroSaved(true);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <Link href="/weekly" className="text-sm text-ink underline underline-offset-2">
          ← 목록
        </Link>
        <h1 className="text-display-xl">{formatWeekRange(plan.weekStart)}</h1>
      </div>
      {error && (
        <p role="alert" className="text-sm text-error">
          {error}
        </p>
      )}

      <section>
        <div className="mb-1 flex items-center justify-between">
          <h2 className="text-title-md">주간 목표</h2>
          <button
            type="button"
            className="rounded-sm border px-2 py-0.5 text-sm"
            onClick={() => setEditing(true)}
          >
            목표 편집
          </button>
        </div>
        <div className="mb-2">
          <ProgressBar value={weeklyProgress(plan.goals)} label="주간 진행률" />
        </div>
        {plan.goals.length === 0 ? (
          <p className="text-sm text-muted">목표가 없습니다.</p>
        ) : (
          plan.goals.map((g, i) => (
            <WeeklyGoalItem
              key={i}
              goal={g}
              onToggle={(done) => void toggleGoal(plan._id, i, done)}
            />
          ))
        )}
      </section>

      <section className="space-y-3">
        <label className="block text-sm">
          <span className="mb-1 block font-medium">메모</span>
          <textarea
            className="w-full rounded-sm border px-2 py-1"
            rows={3}
            value={memoValue}
            onChange={(e) => setMemo(e.target.value)}
            onBlur={() => void saveMemo()}
          />
        </label>
        <div className="text-sm">
          <label className="block">
            <span className="mb-1 block font-medium">회고</span>
            <textarea
              className="w-full rounded-sm border px-2 py-1"
              rows={4}
              value={retroValue}
              onChange={(e) => {
                setRetro(e.target.value);
                setRetroSaved(false);
              }}
              onBlur={() => void saveRetro()}
            />
          </label>
          <div className="mt-1 flex items-center gap-2">
            <button
              type="button"
              className="rounded-sm border px-2 py-0.5"
              onClick={() => void saveRetro()}
            >
              회고 저장
            </button>
            {retroSaved && (
              <span role="status" className="text-ink">
                저장됨
              </span>
            )}
          </div>
        </div>
        <label className="block text-sm">
          <span className="mb-1 block font-medium">1년 목표</span>
          <select
            className="w-full rounded-sm border px-2 py-1"
            value={plan.goalId ?? ""}
            onChange={(e) =>
              void updatePlan(plan._id, { goalId: e.target.value || null })
            }
          >
            <option value="">연결 안 함</option>
            {goals.map((g) => (
              <option key={g._id} value={g._id}>
                {g.title}
              </option>
            ))}
          </select>
        </label>
      </section>

      <section>
        <h2 className="mb-2 text-title-md">주간 그리드</h2>
        <WeekGrid
          planId={plan._id}
          todos={todos}
          onCreate={(input) => addTodo(input)}
          onAssign={(todoId, day) =>
            updateTodo(todoId, { weeklyPlanId: plan._id, dayOfWeek: day })
          }
          onUnassign={(todoId) => updateTodo(todoId, { dayOfWeek: null })}
        />
      </section>

      <Modal
        open={editing}
        title="주간 계획 편집"
        onClose={() => setEditing(false)}
      >
        <WeeklyPlanForm
          initial={{ goals: plan.goals, memo: plan.memo, goalId: plan.goalId }}
          yearGoals={goals}
          submitLabel="저장"
          onSubmit={async (v) => {
            const saved = await updatePlan(plan._id, v);
            if (saved) setEditing(false);
          }}
        />
      </Modal>
    </div>
  );
}

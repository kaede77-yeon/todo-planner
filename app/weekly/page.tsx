"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useStore } from "@/store";
import { formatWeekRange, getWeekStart } from "@/lib/utils";
import ProgressBar from "@/components/shared/ProgressBar";
import { weeklyProgress } from "@/lib/progress";
import Modal from "@/components/shared/Modal";
import WeeklyPlanForm from "@/components/weekly/WeeklyPlanForm";

export default function WeeklyPage() {
  const plans = useStore((s) => s.plans);
  const loading = useStore((s) => s.plansLoading);
  const error = useStore((s) => s.plansError);
  const goals = useStore((s) => s.goals);
  const fetchPlans = useStore((s) => s.fetchPlans);
  const fetchGoals = useStore((s) => s.fetchGoals);
  const addPlan = useStore((s) => s.addPlan);
  const [open, setOpen] = useState(false);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    void fetchPlans();
    void fetchGoals();
  }, [fetchPlans, fetchGoals]);

  const recent = [...plans]
    .sort((a, b) => (a.weekStart < b.weekStart ? 1 : -1))
    .slice(0, 4);
  const weekStart = getWeekStart(new Date());
  const existing = plans.find(
    (p) => new Date(p.weekStart).getTime() === weekStart.getTime()
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-display-xl">주간 계획</h1>
        <button
          type="button"
          className="rounded-sm bg-primary px-3 py-1 text-white"
          onClick={() => {
            setNotice("");
            setOpen(true);
          }}
        >
          이번 주 계획 만들기
        </button>
      </div>
      {notice && (
        <p role="status" className="text-sm text-error">
          {notice}
        </p>
      )}
      {error && (
        <p role="alert" className="text-sm text-error">
          {error}
        </p>
      )}
      {loading && plans.length === 0 && <p>불러오는 중...</p>}
      {!loading && recent.length === 0 && (
        <p className="text-muted">아직 주간 계획이 없습니다.</p>
      )}
      <ul className="space-y-2">
        {recent.map((p) => (
          <li key={p._id}>
            <Link
              href={`/weekly/${p._id}`}
              className="block rounded-card border p-3 transition-shadow hover:shadow-float"
            >
              <div className="font-medium">{formatWeekRange(p.weekStart)}</div>
              <div className="text-sm text-muted">
                목표 {p.goals.filter((g) => g.done).length}/{p.goals.length} 완료
              </div>
              <div className="mt-2">
                <ProgressBar value={weeklyProgress(p.goals)} label="주간 진행률" />
              </div>
            </Link>
          </li>
        ))}
      </ul>
      <Modal open={open} title="이번 주 계획" onClose={() => setOpen(false)}>
        {existing ? (
          <p>
            이번 주 계획이 이미 있습니다.{" "}
            <Link
              className="text-ink underline underline-offset-2"
              href={`/weekly/${existing._id}`}
            >
              열기
            </Link>
          </p>
        ) : (
          <WeeklyPlanForm
            yearGoals={goals}
            submitLabel="만들기"
            onSubmit={async (v) => {
              const created = await addPlan({
                weekStart: weekStart.toISOString(),
                ...v,
              });
              if (!created) {
                // Likely 409 duplicate: reload so the existing plan shows up.
                await fetchPlans();
                setNotice("이번 주 계획이 이미 존재합니다. 목록에서 열어 주세요.");
              }
              setOpen(false);
            }}
          />
        )}
      </Modal>
    </div>
  );
}

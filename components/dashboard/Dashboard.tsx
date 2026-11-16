"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useStore } from "@/store";
import ProgressBar from "@/components/shared/ProgressBar";
import WeeklyGoalItem from "@/components/weekly/WeeklyGoalItem";
import { formatWeekRange, getWeekStart } from "@/lib/utils";
import { weeklyProgress } from "@/lib/progress";
import { countByStatus, todosForPlan, todosPerGoal } from "@/lib/dashboard";

export default function Dashboard() {
  const plans = useStore((s) => s.plans);
  const todos = useStore((s) => s.todos);
  const goals = useStore((s) => s.goals);
  const plansError = useStore((s) => s.plansError);
  const fetchPlans = useStore((s) => s.fetchPlans);
  const fetchTodos = useStore((s) => s.fetchTodos);
  const fetchGoals = useStore((s) => s.fetchGoals);
  const toggleGoal = useStore((s) => s.toggleGoal);

  // "This week" depends on the viewer's local clock/timezone, so it is computed
  // after mount. Computing it during render would bake the build-time week into
  // the prerendered HTML and mismatch on hydration.
  const [weekStart, setWeekStart] = useState<string | null>(null);

  useEffect(() => {
    setWeekStart(getWeekStart(new Date()).toISOString());
  }, []);

  useEffect(() => {
    if (!weekStart) return;
    void fetchPlans(weekStart);
    void fetchTodos();
    void fetchGoals();
  }, [weekStart, fetchPlans, fetchTodos, fetchGoals]);

  const plan = weekStart
    ? plans.find((p) => new Date(p.weekStart).toISOString() === weekStart)
    : undefined;
  const scoped = plan ? todosForPlan(todos, plan._id) : todos;
  const counts = countByStatus(scoped);
  const perGoal = plan ? todosPerGoal(todos, plan, goals) : [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">대시보드</h1>
      {plansError && <p className="text-sm text-red-600">{plansError}</p>}

      <section className="space-y-3 rounded border border-gray-200 bg-white p-4">
        <h2 className="text-lg font-semibold">
          이번 주 계획 <span className="text-sm font-normal text-gray-500">{weekStart ? formatWeekRange(weekStart) : ""}</span>
        </h2>
        {plan ? (
          <>
            <ProgressBar value={weeklyProgress(plan.goals)} label="주간 진행률" />
            <div>
              {plan.goals.length === 0 && <p className="text-sm text-gray-500">등록된 목표가 없습니다.</p>}
              {plan.goals.map((g, i) => (
                <WeeklyGoalItem key={i} goal={g} onToggle={(done) => void toggleGoal(plan._id, i, done)} />
              ))}
            </div>
            {plan.memo && <p className="whitespace-pre-wrap text-sm text-gray-600">{plan.memo}</p>}
          </>
        ) : (
          <div className="text-sm text-gray-500">
            <p>이번 주 계획이 없습니다.</p>
            <Link href="/weekly" className="mt-2 inline-block rounded bg-blue-500 px-3 py-1 text-white">
              주간 계획 만들기
            </Link>
          </div>
        )}
      </section>

      <section className="rounded border border-gray-200 bg-white p-4">
        <h2 className="mb-3 text-lg font-semibold">할 일 현황</h2>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div data-testid="count-todo"><div className="text-2xl font-bold">{counts.todo}</div><div className="text-xs text-gray-600">할 일</div></div>
          <div data-testid="count-doing"><div className="text-2xl font-bold">{counts.doing}</div><div className="text-xs text-gray-600">진행 중</div></div>
          <div data-testid="count-done"><div className="text-2xl font-bold">{counts.done}</div><div className="text-xs text-gray-600">완료</div></div>
        </div>
      </section>

      {plan && (
        <section className="rounded border border-gray-200 bg-white p-4">
          <h2 className="mb-3 text-lg font-semibold">1년 목표별 이번 주 할 일</h2>
          {perGoal.length === 0 ? (
            <p className="text-sm text-gray-500">연결된 할 일이 없습니다.</p>
          ) : (
            <ul className="space-y-1 text-sm">
              {perGoal.map(({ goal, count }) => (
                <li key={goal._id} className="flex justify-between">
                  <span>{goal.title}</span>
                  <span className="text-gray-600">{count}개</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}

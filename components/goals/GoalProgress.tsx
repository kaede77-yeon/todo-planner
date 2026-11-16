import type { Todo } from "@/types";
import { goalProgress } from "@/lib/progress";
import ProgressBar from "@/components/shared/ProgressBar";

interface Props {
  todos: readonly Pick<Todo, "status" | "goalId">[];
  goalId: string;
}

export default function GoalProgress({ todos, goalId }: Props) {
  return <ProgressBar value={goalProgress(todos, goalId)} label="목표 진행률" />;
}

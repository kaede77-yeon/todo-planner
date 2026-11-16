import type { TodoPriority } from "@/types";

const STYLE: Record<TodoPriority, { label: string; cls: string }> = {
  high: { label: "높음", cls: "bg-red-100 text-red-700" },
  medium: { label: "보통", cls: "bg-amber-100 text-amber-700" },
  low: { label: "낮음", cls: "bg-green-100 text-green-700" },
};

export default function PriorityBadge({ priority }: { priority: TodoPriority }) {
  const { label, cls } = STYLE[priority];
  return (
    <span className={`rounded px-1.5 py-0.5 text-xs font-medium ${cls}`}>
      {label}
    </span>
  );
}

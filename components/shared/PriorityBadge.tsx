import type { TodoPriority } from "@/types";

// One accent only: "high" earns the coral outline; the rest stay neutral.
const STYLE: Record<TodoPriority, { label: string; cls: string }> = {
  high: { label: "높음", cls: "border border-primary bg-canvas text-primary" },
  medium: { label: "보통", cls: "border border-hairline bg-canvas text-ink" },
  low: { label: "낮음", cls: "bg-surface-strong text-muted" },
};

export default function PriorityBadge({ priority }: { priority: TodoPriority }) {
  const { label, cls } = STYLE[priority];
  return (
    <span className={`rounded-full px-2 py-0.5 text-badge ${cls}`}>
      {label}
    </span>
  );
}

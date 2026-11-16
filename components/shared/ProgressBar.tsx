interface ProgressBarProps {
  value: number;
  label?: string;
}

export default function ProgressBar({ value, label }: ProgressBarProps) {
  const pct = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div className="w-full">
      <div className="mb-1 flex justify-between text-xs text-body">
        <span>{label ?? "진행률"}</span>
        <span>{pct}%</span>
      </div>
      <div
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label ?? "진행률"}
        className="h-2 w-full overflow-hidden rounded-sm bg-hairline-soft"
      >
        <div className="h-full bg-primary transition-all" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

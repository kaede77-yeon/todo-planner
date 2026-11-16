interface ProgressBarProps {
  value: number;
  label?: string;
}

export default function ProgressBar({ value, label }: ProgressBarProps) {
  const pct = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div className="w-full">
      <div className="mb-1 flex justify-between text-xs text-gray-600">
        <span>{label ?? "진행률"}</span>
        <span>{pct}%</span>
      </div>
      <div
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label ?? "진행률"}
        className="h-2 w-full overflow-hidden rounded bg-gray-200"
      >
        <div className="h-full bg-blue-500 transition-all" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

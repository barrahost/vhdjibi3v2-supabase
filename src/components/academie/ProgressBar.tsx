interface ProgressBarProps {
  completed: number;
  total: number;
  size?: 'sm' | 'md';
  showLabel?: boolean;
}

export function ProgressBar({ completed, total, size = 'md', showLabel = true }: ProgressBarProps) {
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
  const height = size === 'sm' ? 'h-1.5' : 'h-2.5';

  return (
    <div className="w-full">
      <div className={`w-full bg-gray-100 rounded-full overflow-hidden ${height}`}>
        <div
          className={`h-full rounded-full transition-all ${pct === 100 ? 'bg-green-500' : 'bg-brand-700'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      {showLabel && (
        <p className="mt-1 text-xs text-gray-500">
          {completed}/{total} séance{total > 1 ? 's' : ''} terminée{completed > 1 ? 's' : ''} · {pct}%
        </p>
      )}
    </div>
  );
}

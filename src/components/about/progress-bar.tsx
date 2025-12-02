interface ProgressBarProps {
  progress: number;
  label?: string;
  showPercentage?: boolean;
  className?: string;
  color?: "blue" | "green" | "purple" | "orange";
}

export function ProgressBar({
  progress,
  label,
  showPercentage = true,
  className = "",
  color = "blue",
}: ProgressBarProps) {
  const colorClasses = {
    blue: "bg-blue-600 dark:bg-blue-500",
    green: "bg-green-600 dark:bg-green-500",
    purple: "bg-purple-600 dark:bg-purple-500",
    orange: "bg-orange-600 dark:bg-orange-500",
  };

  return (
    <div className={className}>
      {label && (
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="text-stone-600 dark:text-stone-400">{label}</span>
          {showPercentage && (
            <span className="font-medium text-stone-900 dark:text-stone-100">{progress}%</span>
          )}
        </div>
      )}
      <div className="h-2 w-full overflow-hidden rounded-full bg-stone-200 dark:bg-stone-800">
        <div
          className={`h-full transition-all duration-500 ease-out ${colorClasses[color]}`}
          style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
        />
      </div>
    </div>
  );
}

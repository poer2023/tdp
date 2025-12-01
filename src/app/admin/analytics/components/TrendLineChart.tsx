"use client";

/**
 * TrendLineChart Component - SVG Line/Area Chart
 */
type TrendLineEntry = {
  date: string | number | Date;
  totalViews: number;
  uniqueVisitors: number;
};

/**
 * Ensure we are working with Date instances even after serialization
 */
function toDate(value: TrendLineEntry["date"]): Date {
  if (value instanceof Date) return value;
  if (typeof value === "number") return new Date(value);
  return new Date(value);
}

export function TrendLineChart({ data, locale }: { data: TrendLineEntry[]; locale: "en" | "zh" }) {
  if (data.length === 0) return null;

  // Chart dimensions
  const width = 800;
  const height = 200;
  const padding = { top: 20, right: 40, bottom: 30, left: 40 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // Normalize data
  const normalizedData = data.map((entry) => ({
    ...entry,
    date: toDate(entry.date),
  }));

  const maxViews = Math.max(...normalizedData.map((d) => d.totalViews), 1);

  // Calculate points for PV (totalViews) line
  const denominator = Math.max(normalizedData.length - 1, 1);

  const pvPoints = normalizedData.map((d, i) => {
    const x = padding.left + (i / denominator) * chartWidth;
    const y = padding.top + chartHeight - (d.totalViews / maxViews) * chartHeight;
    return { x, y, value: d.totalViews, uv: d.uniqueVisitors };
  });

  if (pvPoints.length === 0) {
    return null;
  }

  // Create path for area fill
  const areaPath = [
    `M ${padding.left} ${padding.top + chartHeight}`,
    ...pvPoints.map((p) => `L ${p.x} ${p.y}`),
    `L ${pvPoints[pvPoints.length - 1]!.x} ${padding.top + chartHeight}`,
    "Z",
  ].join(" ");

  // Create path for line
  const linePath = pvPoints
    .map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`))
    .join(" ");

  // Today's point (last point)
  const todayPoint = pvPoints[pvPoints.length - 1]!;

  return (
    <div className="space-y-4">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full"
        style={{ maxWidth: "100%", height: "auto" }}
      >
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio) => (
          <line
            key={ratio}
            x1={padding.left}
            y1={padding.top + chartHeight * (1 - ratio)}
            x2={padding.left + chartWidth}
            y2={padding.top + chartHeight * (1 - ratio)}
            stroke="currentColor"
            strokeOpacity="0.1"
            className="text-stone-300 dark:text-stone-700"
          />
        ))}

        {/* Area fill with gradient */}
        <defs>
          <linearGradient id="areaGradient" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="rgb(59, 130, 246)" stopOpacity="0.3" />
            <stop offset="100%" stopColor="rgb(59, 130, 246)" stopOpacity="0.05" />
          </linearGradient>
        </defs>
        <path d={areaPath} fill="url(#areaGradient)" />

        {/* Line */}
        <path d={linePath} fill="none" stroke="rgb(59, 130, 246)" strokeWidth="2.5" />

        {/* Data points */}
        {pvPoints.map((point, i) => {
          const isToday = i === pvPoints.length - 1;
          return (
            <g key={i}>
              <circle
                cx={point.x}
                cy={point.y}
                r={isToday ? 5 : 3}
                fill={isToday ? "rgb(59, 130, 246)" : "white"}
                stroke="rgb(59, 130, 246)"
                strokeWidth={isToday ? 2.5 : 2}
                className={isToday ? "drop-shadow-lg" : ""}
              />
            </g>
          );
        })}

        {/* X-axis labels (dates) */}
        {normalizedData.map((d, i) => {
          const showLabel =
            i === 0 ||
            i === normalizedData.length - 1 ||
            i === Math.floor(normalizedData.length / 2);
          if (!showLabel) return null;

          const x = padding.left + (i / Math.max(normalizedData.length - 1, 1)) * chartWidth;
          return (
            <text
              key={i}
              x={x}
              y={height - 5}
              textAnchor="middle"
              className="fill-stone-500 text-[10px] dark:fill-stone-400"
            >
              {d.date.toLocaleDateString(locale === "zh" ? "zh-CN" : "en-US", {
                month: "2-digit",
                day: "2-digit",
              })}
            </text>
          );
        })}

        {/* Y-axis labels */}
        <text
          x={padding.left - 10}
          y={padding.top}
          textAnchor="end"
          className="fill-stone-500 text-[10px] dark:fill-stone-400"
        >
          {maxViews}
        </text>
        <text
          x={padding.left - 10}
          y={padding.top + chartHeight}
          textAnchor="end"
          className="fill-stone-500 text-[10px] dark:fill-stone-400"
        >
          0
        </text>

        {/* Today's label */}
        <g>
          <rect
            x={todayPoint.x - 35}
            y={todayPoint.y - 35}
            width="70"
            height="28"
            rx="6"
            fill="rgb(59, 130, 246)"
            className="drop-shadow-lg"
          />
          <text
            x={todayPoint.x}
            y={todayPoint.y - 20}
            textAnchor="middle"
            className="fill-white text-[11px] font-semibold"
          >
            {todayPoint.value} PV
          </text>
          <text
            x={todayPoint.x}
            y={todayPoint.y - 9}
            textAnchor="middle"
            className="fill-opacity-80 fill-white text-[9px]"
          >
            {todayPoint.uv} UV
          </text>
        </g>
      </svg>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-blue-500" />
          <span className="text-stone-600 dark:text-stone-400">
            PV ({normalizedData.reduce((sum, d) => sum + d.totalViews, 0).toLocaleString()})
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full border-2 border-blue-500 bg-white dark:bg-stone-900" />
          <span className="text-stone-600 dark:text-stone-400">
            UV ({normalizedData.reduce((sum, d) => sum + d.uniqueVisitors, 0).toLocaleString()})
          </span>
        </div>
      </div>
    </div>
  );
}

// Re-export from stats-dashboard directory for backward compatibility
// This file is being deprecated in favor of the modular stats-dashboard/ directory

export { ZhiStatsDashboard as default, ZhiStatsDashboard } from "./stats-dashboard/stats-dashboard-main";
export { AnimatedCounter } from "./stats-dashboard/animated-counter";
export { CodeFrequencyHeatmap } from "./stats-dashboard/code-frequency-heatmap";
export type { HeatmapDay, StatCardData } from "./stats-dashboard/types";

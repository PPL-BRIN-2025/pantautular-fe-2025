"use client";

import type { ChartMode } from "./chartModePreference";
import type { TooltipDatum } from "./tooltip";

/**
 * Strategy pattern: encapsulates chart-mode specific datasets so ChartRenderer
 * stays agnostic of how each mode prepares its points or metadata.
 */
export type ExpertChartPoint = TooltipDatum & {
  label: string;
};

interface ChartModeStrategy {
  readonly title: string;
  buildPoints(): ExpertChartPoint[];
}

const trendStrategy: ChartModeStrategy = {
  title: "Trend Mode - Weekly Cases",
  buildPoints: () => [
    { label: "Minggu 1", value: 12, reference: 10 },
    { label: "Minggu 2", value: 18, reference: 16 },
    { label: "Minggu 3", value: 21, reference: 19 },
    { label: "Minggu 4", value: 26, reference: 24 },
    { label: "Minggu 5", value: 30, reference: 28 },
  ],
};

const groupedTotalsStrategy: ChartModeStrategy = {
  title: "Grouped Totals - Cases by Category",
  buildPoints: () => [
    { label: "Hospitalisasi", value: 42, reference: 40 },
    { label: "Isolasi", value: 55, reference: 50 },
    { label: "Rawat Jalan", value: 31, reference: 34 },
    { label: "Monitoring", value: 24, reference: 20 },
  ],
};

const rawChartStrategy: ChartModeStrategy = {
  title: "Raw Chart - Daily Submissions",
  buildPoints: () => [
    { label: "Senin", value: 14, reference: 13 },
    { label: "Selasa", value: 17, reference: 18 },
    { label: "Rabu", value: 19, reference: 19 },
    { label: "Kamis", value: 16 },
    { label: "Jumat", value: 18, reference: 0 },
  ],
};

const STRATEGIES: Record<ChartMode, ChartModeStrategy> = {
  trend: trendStrategy,
  grouped_totals: groupedTotalsStrategy,
  raw_chart: rawChartStrategy,
};

export const getChartModeStrategy = (mode: ChartMode): ChartModeStrategy =>
  STRATEGIES[mode] ?? trendStrategy;

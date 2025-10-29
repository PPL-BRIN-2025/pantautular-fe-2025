"use client";

import PortalBarChart from "../components/dashboard/sumberBerita/PortalBarChart";
import type { ChartMode } from "./chartModePreference";

type ChartDefinition = Readonly<{
  title: string;
  data: Array<{ portal: string; count: number }>;
}>;

const CHART_DEFINITIONS: Record<ChartMode, ChartDefinition> = {
  trend: {
    title: "Trend Mode – Weekly Cases",
    data: [
      { portal: "Minggu 1", count: 12 },
      { portal: "Minggu 2", count: 18 },
      { portal: "Minggu 3", count: 21 },
      { portal: "Minggu 4", count: 26 },
      { portal: "Minggu 5", count: 30 },
    ],
  },
  grouped_totals: {
    title: "Grouped Totals – Cases by Category",
    data: [
      { portal: "Hospitalisasi", count: 42 },
      { portal: "Isolasi", count: 55 },
      { portal: "Rawat Jalan", count: 31 },
      { portal: "Monitoring", count: 24 },
    ],
  },
  raw_chart: {
    title: "Raw Chart – Daily Submissions",
    data: [
      { portal: "Senin", count: 14 },
      { portal: "Selasa", count: 17 },
      { portal: "Rabu", count: 19 },
      { portal: "Kamis", count: 16 },
      { portal: "Jumat", count: 18 },
    ],
  },
};

type ChartRendererProps = Readonly<{
  mode: ChartMode;
}>;

export default function ChartRenderer({ mode }: ChartRendererProps) {
  const chart = CHART_DEFINITIONS[mode] ?? CHART_DEFINITIONS.trend;

  return (
    <div className="space-y-3" data-testid={`expert-chart-${mode}`}>
      <PortalBarChart title={chart.title} data={chart.data} index={0} />
    </div>
  );
}

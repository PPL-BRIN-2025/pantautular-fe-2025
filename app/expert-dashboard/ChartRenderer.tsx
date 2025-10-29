"use client";

import PortalBarChart from "../components/dashboard/sumberBerita/PortalBarChart";
import type { ChartMode } from "./chartModePreference";
import {
  formatTooltipLines,
  mapToTooltipDatum,
  type TooltipDatum,
} from "./tooltip";

type ExpertDatum = TooltipDatum & { label: string };

type ChartDefinition = Readonly<{
  title: string;
  data: ExpertDatum[];
}>;

const CHART_DEFINITIONS: Record<ChartMode, ChartDefinition> = {
  trend: {
    title: "Trend Mode - Weekly Cases",
    data: [
      { label: "Minggu 1", value: 12, reference: 10 },
      { label: "Minggu 2", value: 18, reference: 16 },
      { label: "Minggu 3", value: 21, reference: 19 },
      { label: "Minggu 4", value: 26, reference: 24 },
      { label: "Minggu 5", value: 30, reference: 28 },
    ],
  },
  grouped_totals: {
    title: "Grouped Totals - Cases by Category",
    data: [
      { label: "Hospitalisasi", value: 42, reference: 40 },
      { label: "Isolasi", value: 55, reference: 50 },
      { label: "Rawat Jalan", value: 31, reference: 34 },
      { label: "Monitoring", value: 24, reference: 20 },
    ],
  },
  raw_chart: {
    title: "Raw Chart - Daily Submissions",
    data: [
      { label: "Senin", value: 14, reference: 13 },
      { label: "Selasa", value: 17, reference: 18 },
      { label: "Rabu", value: 19, reference: 19 },
      { label: "Kamis", value: 16 },
      { label: "Jumat", value: 18, reference: 0 },
    ],
  },
};

type ChartRendererProps = Readonly<{
  mode: ChartMode;
}>;

export default function ChartRenderer({ mode }: ChartRendererProps) {
  const chart = CHART_DEFINITIONS[mode] ?? CHART_DEFINITIONS.trend;

  const data = chart.data.map((datum) => {
    const raw = {
      ...datum,
      portal: datum.label,
      count: datum.value,
    } as Record<string, unknown>;

    const tooltipDatum = mapToTooltipDatum(raw);
    const tooltipLines = formatTooltipLines(tooltipDatum);

    return {
      portal: datum.label,
      count: datum.value,
      tooltipText: tooltipLines.join("\n"),
    };
  });

  return (
    <div className="space-y-3" data-testid={`expert-chart-${mode}`}>
      <PortalBarChart title={chart.title} data={data} index={0} />
    </div>
  );
}

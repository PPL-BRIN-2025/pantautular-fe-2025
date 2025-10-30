"use client";

import PortalBarChart from "../components/dashboard/sumberBerita/PortalBarChart";
import type { ChartMode } from "./chartModePreference";
import { getChartModeStrategy } from "./chartModeStrategies";
import { formatTooltipLines, mapToTooltipDatum } from "./tooltip";

type ChartRendererProps = Readonly<{
  mode: ChartMode;
}>;

export default function ChartRenderer({ mode }: ChartRendererProps) {
  const strategy = getChartModeStrategy(mode);
  const points = strategy.buildPoints();

  const data = points.map((point) => {
    const raw = {
      ...point,
      portal: point.label,
      count: point.value,
    } as Record<string, unknown>;

    const tooltipDatum = mapToTooltipDatum(raw);
    const tooltipLines = formatTooltipLines(tooltipDatum);

    return {
      portal: point.label,
      count: point.value,
      tooltipText: tooltipLines.join("\n"),
    };
  });

  return (
    <div className="space-y-3" data-testid={`expert-chart-${mode}`}>
      <PortalBarChart title={strategy.title} data={data} index={0} />
    </div>
  );
}

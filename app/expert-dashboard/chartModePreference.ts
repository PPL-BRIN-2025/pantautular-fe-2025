export const CHART_MODE_STORAGE_KEY = "expert-dashboard:chart-mode";

export const CHART_MODES = ["trend", "grouped_totals", "raw_chart"] as const;

export type ChartMode = (typeof CHART_MODES)[number];

export const DEFAULT_CHART_MODE: ChartMode = "trend";

export const CHART_MODE_METADATA: Record<
  ChartMode,
  { label: string; description: string }
> = {
  trend: {
    label: "Trend",
    description:
      "Track how case counts change over time with the time-series visualization.",
  },
  grouped_totals: {
    label: "Grouped totals",
    description:
      "Compare cumulative totals for each category to highlight distribution differences.",
  },
  raw_chart: {
    label: "Raw chart",
    description:
      "Inspect the ungrouped chart exactly as provided by the data source.",
  },
};

export const CHART_MODE_OPTIONS = Object.freeze(
  CHART_MODES.map((mode) => ({
    value: mode,
    ...CHART_MODE_METADATA[mode],
  }))
);

const hasWindow = () => typeof window !== "undefined";

const isChartMode = (value: unknown): value is ChartMode =>
  typeof value === "string" &&
  (CHART_MODES as readonly string[]).includes(value);

export const loadChartModePreference = (): ChartMode | null => {
  if (!hasWindow()) return null;

  try {
    const raw = window.localStorage.getItem(CHART_MODE_STORAGE_KEY);
    if (isChartMode(raw)) return raw;
  } catch {
    // Swallow storage access errors (e.g., quota, disabled storage)
  }

  return null;
};

export const saveChartModePreference = (mode: ChartMode): void => {
  if (!hasWindow()) return;

  try {
    window.localStorage.setItem(CHART_MODE_STORAGE_KEY, mode);
  } catch {
    // Ignore persistence failures; preference fallback still works.
  }
};

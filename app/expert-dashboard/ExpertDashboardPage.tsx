"use client";

import { useEffect, useMemo, useState } from "react";
import ChartModeSelector from "./ChartModeSelector";
import ChartRenderer from "./ChartRenderer";
import {
  type ChartMode,
  CHART_MODE_METADATA,
  DEFAULT_CHART_MODE,
  loadChartModePreference,
  saveChartModePreference,
} from "./chartModePreference";

export default function ExpertDashboardPage() {
  const [mode, setMode] = useState<ChartMode>(DEFAULT_CHART_MODE);

  useEffect(() => {
    const stored = loadChartModePreference();
    if (stored && stored !== mode) {
      setMode(stored);
    }
    // We intentionally run this effect only once to hydrate from storage.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const modeMeta = useMemo(() => CHART_MODE_METADATA[mode], [mode]);

  const handleModeChange = (nextMode: ChartMode) => {
    if (nextMode === mode) return;
    setMode(nextMode);
    saveChartModePreference(nextMode);
  };

  return (
    <main className="mx-auto max-w-6xl px-6 py-10" data-testid="expert-dashboard">
      <div className="space-y-6">
        <header className="space-y-2">
          <h1 className="text-3xl font-semibold text-[#0069CF]">
            Expert Dashboard
          </h1>
          <p className="text-sm text-slate-600">
            Explore critical indicators with flexible visualization modes tailored
            for expert reviews.
          </p>
        </header>
        <section className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="space-y-1">
              <h2 className="text-xl font-semibold text-slate-900">
                Visualization Mode
              </h2>
              <p
                className="text-sm text-slate-500"
                data-testid="mode-description"
              >
                {modeMeta.description}
              </p>
            </div>
            <ChartModeSelector value={mode} onChange={handleModeChange} />
          </div>
          <ChartRenderer mode={mode} />
        </section>
      </div>
    </main>
  );
}

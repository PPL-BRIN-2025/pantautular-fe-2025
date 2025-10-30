"use client";

import clsx from "clsx";
import { type ChartMode, CHART_MODE_OPTIONS } from "./chartModePreference";

type ChartModeSelectorProps = Readonly<{
  value: ChartMode;
  onChange: (mode: ChartMode) => void;
  className?: string;
}>;

const basePillClasses =
  "peer inline-flex items-center justify-center rounded-full border px-4 py-2 text-sm font-medium transition focus:outline-none";
const focusRingClasses =
  "peer-focus-visible:ring-2 peer-focus-visible:ring-offset-2 peer-focus-visible:ring-[#0069CF]";

export default function ChartModeSelector({
  value,
  onChange,
  className = "",
}: ChartModeSelectorProps) {
  return (
    <fieldset className={clsx("flex flex-wrap gap-2", className)}>
      <legend className="sr-only">Pilih mode visualisasi</legend>
      {CHART_MODE_OPTIONS.map((option) => {
        const isSelected = option.value === value;
        return (
          <label
            key={option.value}
            className="cursor-pointer select-none"
            data-selected={isSelected}
          >
            <input
              type="radio"
              name="chart-mode"
              value={option.value}
              checked={isSelected}
              onChange={() => onChange(option.value)}
              className="sr-only peer"
            />
            <span
              className={clsx(
                basePillClasses,
                focusRingClasses,
                isSelected
                  ? "border-[#0069CF] bg-[#0069CF] text-white shadow-sm"
                  : "border-[#0069CF] bg-white text-[#0069CF] hover:bg-[#e6f0ff]"
              )}
            >
              {option.label}
            </span>
          </label>
        );
      })}
    </fieldset>
  );
}

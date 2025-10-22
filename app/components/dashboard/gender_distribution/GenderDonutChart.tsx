"use client";
import React, { useRef } from "react";
import useDonutChart from "./ChartHook";
import ChartHeader from "./ChartHeader";
import DownloadButton from "../DownloadButton";

interface GenderDonutChartProps {
  total?: number;
  priaValue?: number;
  wanitaValue?: number;
}


const GenderDonutChart: React.FC<GenderDonutChartProps> = ({ total, priaValue, wanitaValue }) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const totalCount =
    (typeof total === "number" ? total : 0) ||
    (priaValue ?? 0) + (wanitaValue ?? 0);
  
  // Initialize the chart using our custom hook
  useDonutChart(chartRef, priaValue ?? 0, wanitaValue ?? 0);

  return (
    <div className="relative w-full pt-8">
      <div className="absolute right-0 top-0 flex gap-2">
        <DownloadButton
          filename="distribusi-jenis-kelamin"
          getTarget={() => containerRef.current}
          canDownload={() => totalCount > 0}
        />
      </div>
      <div ref={containerRef} className="bg-white rounded-md p-4 shadow-md w-full">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <ChartHeader
            title="Jenis Kelamin"
            total={total ?? 0}
          />
        </div>
        <div ref={chartRef} className="w-full h-64 mt-4" />
      </div>
    </div>
  );
};

export default GenderDonutChart;

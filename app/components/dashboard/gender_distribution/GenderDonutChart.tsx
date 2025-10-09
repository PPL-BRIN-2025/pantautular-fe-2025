"use client";
import React, { useRef, useContext } from "react";
import useDonutChart from "./ChartHook";
import ChartHeader from "./ChartHeader";
import * as am5 from "@amcharts/amcharts5";
import { exportChartAndLog } from "../../../../curator-feature/export/exporter";
import { toast } from "../../../../curator-feature/ui/ToastCenter";
import { AuthContext } from "../../../auth/context";

interface GenderDonutChartProps {
  total?: number;
  priaValue?: number;
  wanitaValue?: number;
}


const GenderDonutChart: React.FC<GenderDonutChartProps> = ({ total, priaValue, wanitaValue }) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const auth = useContext(AuthContext);
  
  // Initialize the chart using our custom hook
  useDonutChart(chartRef, priaValue ?? 0, wanitaValue ?? 0);

  return (
    <div className="bg-white rounded-md p-4 shadow-md w-full">
      <div className="flex items-center justify-between">
        <ChartHeader title="Jenis Kelamin" total={total ?? 0} />
        <button
          type="button"
          onClick={async () => {
            const el = chartRef.current;
            const root = el ? am5.Root.new(el) : null;
            await exportChartAndLog({
              element: el,
              chartType: "gender-donut",
              fileName: "gender_donut_chart",
              imageType: "png",
              hasData: (priaValue ?? 0) + (wanitaValue ?? 0) > 0,
              getRoot: () => root,
              username: auth?.user?.name ?? null,
              notify: (t, m) => toast(t, m),
            });
          }}
          className="bg-[#0069CF] hover:bg-[#0057a8] text-white text-xs py-1.5 px-3 rounded"
          aria-label="Download chart image"
        >
          Download
        </button>
      </div>
      <div ref={chartRef} className="w-full h-64 mt-4" />
    </div>
  );
};

export default GenderDonutChart;

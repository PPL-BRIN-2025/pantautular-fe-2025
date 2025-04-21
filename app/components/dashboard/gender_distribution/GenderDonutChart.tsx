"use client";
import React, { useRef } from "react";
import useDonutChart from "./ChartHook";
import ChartHeader from "./ChartHeader";

interface GenderDonutChartProps {
  total?: number;
  priaValue?: number;
  wanitaValue?: number;
}


const GenderDonutChart: React.FC<GenderDonutChartProps> = ({total, priaValue, wanitaValue
}) => {
  const chartRef = useRef<HTMLDivElement>(null);
  
  // Initialize the chart using our custom hook
  useDonutChart(chartRef, priaValue ?? 0, wanitaValue ?? 0);

  return (
    <div className="bg-white rounded-md p-4 shadow-md w-full">
      <ChartHeader title="Jenis Kelamin" total={total ?? 0} />
      <div ref={chartRef} className="w-full h-64 mt-4" />
    </div>
  );
};

export default GenderDonutChart;
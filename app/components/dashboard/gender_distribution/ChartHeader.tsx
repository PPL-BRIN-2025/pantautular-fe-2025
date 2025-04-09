import React from "react";
interface ChartHeaderProps {
  title: string;
  total: number;
}

const ChartHeader: React.FC<ChartHeaderProps> = ({ title, total }) => (
  <div className="flex items-center justify-between">
    <h2 className="text-lg font-semibold">{title}</h2>
    <div className="flex items-center text-gray-600">
      <svg className="w-5 h-5 mr-1" fill="currentColor" viewBox="0 0 16 16">
        <path d="M3 14s-1 0-1-1 1-4 6-4 6 3 6 4-1 1-1 1H3Zm5-6a3 3 0 1 0-0-6 3 3 0 0 0 0 6Z" />
      </svg>
      <span>{total.toLocaleString("id-ID")}</span>
    </div>
  </div>
);
export default ChartHeader

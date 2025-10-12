import React from "react";
import PeopleIcon from "../../icons/PeopleIcon";

interface ChartHeaderProps {
  title: string;
  total: number;
  action?: React.ReactNode;
}

const ChartHeader: React.FC<ChartHeaderProps> = ({ title, total, action }) => (
  <div className="flex flex-wrap items-center justify-between gap-3">
    <h3 className="text-xl font-semibold text-[#0069CF]">{title}</h3>
    <div className="flex items-center gap-3">
      <div className="flex items-center text-[#0069CF] text-xl font-bold">
        <PeopleIcon className="w-6 h-6 mr-2" />
        {total.toLocaleString("id-ID")}
      </div>
      {action}
    </div>
  </div>
);
export default ChartHeader

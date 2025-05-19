import React from "react";
import PeopleIcon from "../../icons/PeopleIcon";

interface ChartHeaderProps {
  title: string;
  total: number;
}

const ChartHeader: React.FC<ChartHeaderProps> = ({ title, total }) => (
  <div className="flex items-center justify-between">
    <h3 className="text-xl font-semibold text-[#0069CF]">{title}</h3>
    <div className="flex items-center text-[#0069CF] text-xl font-bold">
      <PeopleIcon className="w-6 h-6 mr-2" />
      {total.toLocaleString("id-ID")}
    </div>
  </div>
);
export default ChartHeader

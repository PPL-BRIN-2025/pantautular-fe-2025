import React from "react";
import { DiseaseSeverityChart, ProvinceSeverityChart, CitySeverityChart } from "../severity/Severity";
import { FilterState } from "../../../types";
import AreaMap from "./area_map/AreaMap";

interface CasesOrderProps {
  filter?: FilterState;
}

const CasesOrder = ({ filter }: CasesOrderProps) => {
  console.log('CasesOrder received filter:', filter);
  return (
    <div className="grid grid-cols-1 gap-4">
      <div className="bg-[#ebf3f5] px-4 py-3 rounded-md">
        <span className="text-[#11234B] text-2xl font-semibold">
          Rangkuman yang diberikan mencakup data per <span className="text-green-600">tahun 2025</span>.
        </span>
      </div>
      <div className="chart-card">
        <DiseaseSeverityChart filter={filter}/>
      </div>
      <div className="chart-card">
        <ProvinceSeverityChart filter={filter}/>
      </div>
      <div className="chart-card">
        <CitySeverityChart filter={filter}/>
      </div>
      <AreaMap/>
    </div>
  );
};

export default CasesOrder;
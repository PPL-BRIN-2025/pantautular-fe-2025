import React from "react";
import { DiseaseSeverityChart, ProvinceSeverityChart, CitySeverityChart } from "../severity/Severity";
const CasesOrder = () => {
    return (
        <div className="grid grid-cols-1 gap-4">
            <div className="bg-[#ebf3f5] px-4 py-3 rounded-md">
                <span className="text-[#11234B] text-2xl font-semibold">
                    Rangkuman yang diberikan mencakup data per <span className="text-green-600">tahun 2025</span>.
                </span>
            </div>
            <div className="chart-card">
                <DiseaseSeverityChart/>
            </div>
            <div className="chart-card">
                <ProvinceSeverityChart/>
            </div>
            <div className="chart-card">
                <CitySeverityChart/>
            </div>
        </div>
    );
};

export default CasesOrder;
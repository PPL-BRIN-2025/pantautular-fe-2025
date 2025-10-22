// components/dashboard/InformationSection.tsx
"use client";
import React, { useState } from "react";
import GeneralInformation from "./GeneralInformation";
import CasesOrder from "./CasesOrder";
import DashboardButton from "../floating_buttons/DashboardButton";
import { MapButton } from "../floating_buttons/MapButton";
import { useDashboardData } from "../../../hooks/useDashboardData";
import { FilterState } from "../../../types";

interface InformationSectionProps {
  filterState?: FilterState;
}

const InformationSection = ({ filterState }: InformationSectionProps) => {
  console.log('InformationSection received filter:', filterState);
  const [activeSection, setActiveSection] = useState("section1");
  // Pass the filterState to the hook so it refetches when filters change.
  const { data, isLoading, error } = useDashboardData(filterState);

  let content;
  if (isLoading) {
    content = <p className="text-black">Loading...</p>;
  } else if (error) {
    content = <p className="text-red-500">{error}</p>;
  } else if (activeSection === "section1") {
    content = <GeneralInformation data={data} />;
  } else {
    content = <CasesOrder filter={filterState} />;
  }

  return (
    <div className="flex flex-col h-full bg-transparent text-white text-xl p-4 pt-8 pl-8">
      <div className="flex justify-between">
        <div className="flex gap-4 bg-white p-2 shadow-md rounded-t-lg w-8/12">
          <button
            className={`px-4 py-2 transition-colors border-b-4 ${
              activeSection === "section1"
                ? "border-blue-500 text-black"
                : "border-transparent text-gray-500"
            }`}
            onClick={() => setActiveSection("section1")}
          >
            Informasi Umum
          </button>
          <button
            className={`px-4 py-2 transition-colors border-b-4 ${
              activeSection === "section2"
                ? "border-blue-500 text-black"
                : "border-transparent text-gray-500"
            }`}
            onClick={() => setActiveSection("section2")}
          >
            Urutan Kasus
          </button>
        </div>
        <div className="fixed right-5 z-20 flex gap-2">
          <DashboardButton />
          <MapButton />
        </div>
      </div>

      {/* Dynamic Section using extracted content */}
      <div className="flex-grow mt-4">
        {content}
      </div>
    </div>
  );
};

export default InformationSection;

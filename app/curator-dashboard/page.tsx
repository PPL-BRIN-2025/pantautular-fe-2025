

"use client";
import Navbar from "../components/Navbar";
import FilterSection from "../components/dashboard/FilterSection";
import InformationSection from "../components/dashboard/InformationSection";
import { useState } from "react";
import { FilterState, FilterStateDashboard } from "@/types";

export default function CuratorDashboardPage() {
  const [filterState, setFilterState] = useState<FilterState | undefined>(undefined);

  // Convert FilterStateDashboard to FilterState for InformationSection
  const handleFilterSubmit = (filters: FilterStateDashboard) => {
    // Flatten locations to string[] for InformationSection
    const flatLocations = [
      ...(filters.locations.provinces ?? []),
      ...(filters.locations.cities ?? [])
    ];
    const converted: FilterState = {
      diseases: filters.diseases,
      locations: flatLocations,
      level_of_alertness: filters.level_of_alertness,
      portals: filters.portals,
      start_date: filters.start_date,
      end_date: filters.end_date,
    };
    setFilterState(converted);
  };

  const handleError = (message: string) => {
    // Optionally show a toast or log
    console.error(message);
  };

  return (
    <div className="min-h-screen bg-[#ebf3f5]">
      <Navbar />
      <div className="h-full flex w-full gap-5">
        <div className="w-2/5 bg-transparent">
          <FilterSection 
            onSubmitFilterState={handleFilterSubmit}
            onError={handleError}
          />
        </div>
        <div className="w-3/5 bg-transparent">
          <InformationSection filterState={filterState} />
        </div>
      </div>
    </div>
  );
}

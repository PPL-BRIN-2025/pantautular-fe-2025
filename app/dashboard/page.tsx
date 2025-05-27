// dashboard/page.tsx
"use client";
import React, { useState } from "react";
import Navbar from "../components/Navbar";
import FilterSection from "../components/dashboard/FilterSection";
import InformationSection from "../components/dashboard/InformationSection";
import { FilterState } from "@/types";

const Page = () => {
  // Hold the current filters in state – initially no filters are applied.
  const [filterState, setFilterState] = useState<FilterState | undefined>(undefined);

  // This callback will be triggered when the user submits new filters.
  const handleFilterSubmit = (filters: FilterState) => {
    console.log('Filter submitted:', filters);
    setFilterState(filters);
  };

  // A simple error handler that you can expand as needed.
  const handleError = (message: string) => {
    console.error(message);
  };

  return (
    <div className="min-h-screen bg-[#ebf3f5]">
      <Navbar />
      <div className="h-[calc(100vh-64px)] flex w-full gap-5">
        <div className="w-2/5">
          <FilterSection 
            onSubmitFilterState={handleFilterSubmit}
            onError={handleError}
            // You can pass an initialFilterState here if needed.
          />
        </div>
        <div className="w-3/5 bg-transparent overflow-y-auto">
          <InformationSection filterState={filterState} />
        </div>
      </div>
    </div>
  );
};

export default Page;



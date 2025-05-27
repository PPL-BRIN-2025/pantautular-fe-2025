// components/dashboard/FilterSection.tsx
"use client";
import React from "react";
import FilterForm from "./FilterForm";
import { FilterStateDashboard } from "../../../types";

interface FilterSectionProps {
  onSubmitFilterState?: (filterState: FilterStateDashboard) => void;
  onError: (message: string) => void;
  initialFilterState?: FilterStateDashboard | null;
}

const FilterSection = ({
  onSubmitFilterState,
  initialFilterState,
  onError,
}: FilterSectionProps) => {
  return (
    <div className="lg:sticky lg:top-16 lg:bottom-16 flex flex-col lg:h-screen bg-transparent text-xl p-2 pt-8 pl-20 z-30 pb-32">
      <div className="flex-grow">
        <FilterForm
          onSubmitFilterState={onSubmitFilterState}
          initialFilterState={initialFilterState}
          onError={onError}
        />
      </div>
    </div>
  );
};

export default FilterSection;

// lg:sticky lg:top-0 lg:h-screen lg:overflow-y-auto bg-transparent z-30
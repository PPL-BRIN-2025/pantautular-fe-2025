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
    <div className="fixed flex flex-col h-full bg-transparent text-xl p-2 pt-8 pl-20 z-30 overflow-y-auto pb-32">
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

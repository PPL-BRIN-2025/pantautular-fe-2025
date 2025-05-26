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
    <div className="h-full flex flex-col bg-transparent text-xl p-4">
      <div className="sticky top-0 flex justify-center">
        <div className="w-full max-w-lg">
          <FilterForm
            onSubmitFilterState={onSubmitFilterState}
            initialFilterState={initialFilterState}
            onError={onError}
          />
        </div>
      </div>
    </div>
  );
};

export default FilterSection;


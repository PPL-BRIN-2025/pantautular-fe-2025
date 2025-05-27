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
    <div className="h-screen overflow-y-auto p-4">
      <FilterForm
        onSubmitFilterState={onSubmitFilterState}
        initialFilterState={initialFilterState}
        onError={onError}
      />
    </div>
  );
};

export default FilterSection;


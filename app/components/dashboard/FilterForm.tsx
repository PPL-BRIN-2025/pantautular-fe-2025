"use client";

import React, { useEffect, useState, FormEvent } from "react";
import Select, { MultiValue } from "react-select";
import DatePicker from "react-datepicker";
import { FilterState } from "../../../types";
import "react-datepicker/dist/react-datepicker.css";

interface SelectOption {
  value: string;
  label: string;
}

interface FilterOptions {
  diseases: SelectOption[];
  locations: SelectOption[];
  news: SelectOption[];
}

interface MultiSelectFormProps {
  onSubmitFilterState?: (filterState: FilterState) => void;
  apiFilterOptions?: string;
  initialFilterState?: FilterState | null;
  onError: (message: string) => void;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

const createSelectOptions = (items: any[], allOption = true) => {
  const baseOptions = allOption ? [{ value: "all", label: "Pilih Semua" }] : [];
  return [...baseOptions, ...items];
};

const handleSelectChange = (
  newValue: MultiValue<SelectOption>,
  currentSelected: SelectOption[],
  allOptions: SelectOption[],
  setSelected: (value: SelectOption[]) => void
) => {
  if (newValue.some((option) => option.value === "all")) {
    if (currentSelected.length === allOptions.length - 1) {
      setSelected([]);
    } else {
      setSelected(allOptions.slice(1));
    }
  } else {
    setSelected(newValue as SelectOption[]);
  }
};

const LoadingPlaceholder = ({ label }: { label?: string }) => (
  <div>
    {label && <span className="block text-sm font-medium mb-1">{label}</span>}
    <div className="h-10 bg-gray-100 rounded-md animate-pulse" />
  </div>
);

const LoadingForm = () => (
  <div className="bg-white rounded-lg shadow-md overflow-hidden w-full max-w-md">
    <div className="bg-blue-500 px-6 py-4">
      <h2 className="text-white text-lg font-semibold">Filter Informasi Penyakit Menular</h2>
    </div>
    <div className="p-6 space-y-4">
      <LoadingPlaceholder label="Jenis Penyakit" />
      <LoadingPlaceholder label="Lokasi" />
      <LoadingPlaceholder label="Sumber Berita" />
      <LoadingPlaceholder label="Tingkat Kewaspadaan" />
      <LoadingPlaceholder label="Tanggal" />
    </div>
  </div>
);

const SelectField = ({
  label,
  options,
  value,
  onChange,
  instanceId
}: {
  label: string;
  options: SelectOption[];
  value: SelectOption[];
  onChange: (newValue: MultiValue<SelectOption>) => void;
  instanceId: string;
}) => {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return <LoadingPlaceholder label={label} />;
  }

  return (
    <div>
      <label className="block text-sm font-medium">{label}</label>
      <Select
        options={options}
        isMulti
        value={value}
        onChange={onChange}
        className="mt-1 text-sm"
        instanceId={instanceId}
        aria-activedescendant={undefined}
      />
    </div>
  );
};

const DateRangeField = ({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange
}: {
  startDate: Date | null;
  endDate: Date | null;
  onStartDateChange: (date: Date | null) => void;
  onEndDateChange: (date: Date | null) => void;
}) => {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return <LoadingPlaceholder label="Tanggal" />;
  }

  return (
    <div>
      <span className="block text-sm font-medium mb-1">Tanggal</span>
      <div className="flex items-center gap-2 text-sm">
        <DatePicker
          selected={startDate}
          onChange={onStartDateChange}
          selectsStart
          startDate={startDate}
          endDate={endDate}
          maxDate={endDate || undefined}
          placeholderText="Mulai"
          className="border p-2 rounded-md w-full"
        />
        <span>-</span>
        <DatePicker
          selected={endDate}
          onChange={onEndDateChange}
          selectsEnd
          startDate={startDate}
          endDate={endDate}
          minDate={startDate || undefined}
          placeholderText="Selesai"
          className="border p-2 rounded-md w-full"
        />
      </div>
    </div>
  );
};

const AlertLevelField = ({
  level,
  onChange
}: {
  level: number;
  onChange: (level: number) => void;
}) => (
  <div>
    <span className="block text-sm font-medium mb-1">Tingkat Kewaspadaan:</span>
    <div className="border border-gray-300 text-sm rounded-md pb-1 pr-3 flex items-center justify-between shadow-sm mb-4">
      <span className="text-gray-400 pl-3">Atur tingkat Kewaspadaan:</span>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            className={`text-3xl transition-all ${
              star <= level ? "text-yellow-400" : "text-gray-300"
            }`}
            onClick={() => onChange(star)}
          >
            {star <= level ? "★" : "☆"}
          </button>
        ))}
      </div>
    </div>
  </div>
);

const FilterForm = ({
  apiFilterOptions = `${API_BASE_URL}/api/filters/`,
  onSubmitFilterState,
  initialFilterState,
  onError,
}: MultiSelectFormProps) => {
  const [selectedDiseases, setSelectedDiseases] = useState<SelectOption[]>([]);
  const [selectedLocations, setSelectedLocations] = useState<SelectOption[]>([]);
  const [selectedNews, setSelectedNews] = useState<SelectOption[]>([]);
  const [selectedStartDate, setSelectedStartDate] = useState<Date | null>(null);
  const [selectedEndDate, setSelectedEndDate] = useState<Date | null>(null);
  const [selectedLevelOfAlertness, setSelectedLevelOfAlertness] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingFilters, setIsLoadingFilters] = useState(false);
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    diseases: [],
    locations: [],
    news: [],
  });
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    async function fetchFilters() {
      setIsLoadingFilters(true);
      try {
        const response = await fetch(apiFilterOptions, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          mode: "cors",
        });
        
        if (response.ok) {
          const responseFilters = await response.json();
          const options = {
            diseases: createSelectOptions(responseFilters.data.diseases),
            locations: createSelectOptions(responseFilters.data.locations),
            news: createSelectOptions(responseFilters.data.news),
          };
          setFilterOptions(options);
          
          if (initialFilterState) {
            const setInitialValues = (
              items: string[],
              options: SelectOption[],
              setter: (value: SelectOption[]) => void
            ) => {
              setter(
                items.map(item => 
                  options.find(option => option.value === item) || 
                  { value: item, label: item }
                )
              );
            };

            setInitialValues(initialFilterState.diseases, options.diseases, setSelectedDiseases);
            setInitialValues(initialFilterState.locations, options.locations, setSelectedLocations);
            setInitialValues(initialFilterState.portals, options.news, setSelectedNews);
            
            setSelectedLevelOfAlertness(initialFilterState.level_of_alertness || 0);
            setSelectedStartDate(initialFilterState.start_date ? new Date(initialFilterState.start_date) : null);
            setSelectedEndDate(initialFilterState.end_date ? new Date(initialFilterState.end_date) : null);
          }
        } else {
          console.error("Failed to fetch filter options");
        }
      } catch (error) {
        console.error("Error fetching filter data", error);
        onError("Failed to load the map. Please try again.");
      } finally {
        setIsLoadingFilters(false);
      }
    }
    fetchFilters();
  }, [apiFilterOptions, initialFilterState, onError]);

  const handleDiseaseChange = (newValue: MultiValue<SelectOption>) => {
    handleSelectChange(newValue, selectedDiseases, filterOptions.diseases, setSelectedDiseases);
  };

  const handleLocationChange = (newValue: MultiValue<SelectOption>) => {
    handleSelectChange(newValue, selectedLocations, filterOptions.locations, setSelectedLocations);
  };

  const handleNewsChange = (newValue: MultiValue<SelectOption>) => {
    handleSelectChange(newValue, selectedNews, filterOptions.news, setSelectedNews);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const filterState: FilterState = {
      diseases: selectedDiseases.map((disease) => disease.value),
      locations: selectedLocations.map((location) => location.value),
      portals: selectedNews.map((news) => news.value),
      level_of_alertness: selectedLevelOfAlertness,
      start_date: selectedStartDate,
      end_date: selectedEndDate
    };

    try {
      if (onSubmitFilterState) {
        onSubmitFilterState(filterState);
      }
    } catch (error) {
      console.error(error);
      onError("Failed to load the map. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setSelectedDiseases([]);
    setSelectedLocations([]);
    setSelectedNews([]);
    setSelectedLevelOfAlertness(0);
    setSelectedStartDate(null);
    setSelectedEndDate(null);
  };

  if (!isMounted) {
    return <LoadingForm />;
  }

  if (isLoadingFilters) {
    return <LoadingForm />;
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden w-full max-w-md">
      <div className="bg-blue-500 px-6 py-4">
        <h2 className="text-white text-lg font-semibold">Filter Informasi Penyakit Menular</h2>
      </div>
      <form data-testid="map-filter-select" onSubmit={handleSubmit} className="space-y-4 p-6">
        <SelectField
          label="Jenis Penyakit"
          options={filterOptions.diseases}
          value={selectedDiseases}
          onChange={handleDiseaseChange}
          instanceId="disease-select"
        />

        <SelectField
          label="Lokasi"
          options={filterOptions.locations}
          value={selectedLocations}
          onChange={handleLocationChange}
          instanceId="location-select"
        />

        <SelectField
          label="Sumber Berita"
          options={filterOptions.news}
          value={selectedNews}
          onChange={handleNewsChange}
          instanceId="news-select"
        />

        <AlertLevelField
          level={selectedLevelOfAlertness}
          onChange={setSelectedLevelOfAlertness}
        />

        <DateRangeField
          startDate={selectedStartDate}
          endDate={selectedEndDate}
          onStartDateChange={setSelectedStartDate}
          onEndDateChange={setSelectedEndDate}
        />

        <div className="flex justify-end gap-2 text-sm">
          <button
            type="button"
            onClick={handleReset}
            className="w-1/4 border rounded-md text-gray-600 hover:bg-gray-100 py-2"
          >
            Reset
          </button>
          <button
            type="submit"
            data-testid="submit-button-form-filter"
            className="w-1/4 bg-blue-500 text-white py-2 rounded-md"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Mengirim..." : "Terapkan"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default FilterForm; 
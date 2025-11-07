"use client";

import React, { useEffect, useState, FormEvent } from "react";
import Select, { MultiValue, SingleValue } from "react-select";
import DatePicker from "react-datepicker";
import type { FilterStateDashboard, ExpertBatch } from "../../../types";
import "react-datepicker/dist/react-datepicker.css";
import { mapApi } from "../../../services/api";

interface SelectOption {
  value: string;
  label: string;
}

interface GroupedOption {
  label: string;
  options: SelectOption[];
}

type SelectOptionType = SelectOption | GroupedOption;

interface FilterOptions {
  diseases: SelectOption[];
  locations: {
    provinces: SelectOption[];
    cities: SelectOption[];
  };
  news: SelectOption[];
}

interface MultiSelectFormProps {
  onSubmitFilterState?: (filterState: FilterStateDashboard) => void;
  apiFilterOptions?: string;
  initialFilterState?: FilterStateDashboard | null;
  onError: (message: string) => void;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;
const ALL_UPLOADS_OPTION: SelectOption = { value: "", label: "All uploads" };

const createSelectOptions = (items: any[], allOption = true) => {
  const baseOptions = allOption ? [{ value: "all", label: "Pilih Semua" }] : [];
  return [...baseOptions, ...items];
};

const createBatchSelectOptions = (batches: ExpertBatch[]): SelectOption[] => {
  const batchOptions = batches.map((batch) => ({
    value: batch.id,
    label: batch.filename || batch.id,
  }));

  return [ALL_UPLOADS_OPTION, ...batchOptions];
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
      <LoadingPlaceholder label="CSV Upload" />
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
  instanceId,
  isMulti = true,
}: {
  label: string;
  options: SelectOptionType[];
  value: SelectOption[];
  onChange: (newValue: MultiValue<SelectOption>) => void;
  instanceId: string;
  isMulti?: boolean;
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
        isMulti={isMulti}
        value={value}
        onChange={onChange}
        className="mt-1 text-sm"
        instanceId={instanceId}
        aria-activedescendant={undefined}
      />
    </div>
  );
};

const SingleSelectField = ({
  label,
  options,
  value,
  onChange,
  instanceId,
  placeholder,
}: {
  label: string;
  options: SelectOption[];
  value: SelectOption | null;
  onChange: (newValue: SingleValue<SelectOption>) => void;
  instanceId: string;
  placeholder?: string;
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
        isClearable
        value={value}
        onChange={onChange}
        className="mt-1 text-sm"
        instanceId={instanceId}
        placeholder={placeholder}
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

const handleError = (error: any, onError: (message: string) => void) => {
  console.error(error);
  onError("Failed to load the map. Please try again.");
};

const createFilterState = (
  selectedDiseases: SelectOption[],
  selectedLocations: SelectOption[],
  selectedNews: SelectOption[],
  selectedLevelOfAlertness: number,
  selectedStartDate: Date | null,
  selectedEndDate: Date | null,
  selectedBatch: SelectOption | null,
  filterOptions: FilterOptions
): FilterStateDashboard => {
  // Separate locations into provinces and cities
  const provinces: string[] = [];
  const cities: string[] = [];

  selectedLocations.forEach(location => {
    const isProvince = filterOptions.locations.provinces.some(
      province => province.value === location.value
    );
    if (isProvince) {
      provinces.push(location.value);
    } else {
      cities.push(location.value);
    }
  });

  return {
    diseases: selectedDiseases.map((disease) => disease.value),
    locations: {
      provinces,
      cities
    },
    portals: selectedNews.map((news) => news.value),
    level_of_alertness: selectedLevelOfAlertness,
    start_date: selectedStartDate,
    end_date: selectedEndDate,
    batch: selectedBatch && selectedBatch.value !== "" ? selectedBatch.value : null,
  };
};

const fetchFilterOptions = async (apiFilterOptions: string) => {
  const response = await fetch(apiFilterOptions, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    mode: "cors",
  });
  
  if (!response.ok) {
    throw new Error("Failed to fetch filter options");
  }
  
  return response.json();
};

const createFilterOptions = (responseFilters: any) => ({
  diseases: createSelectOptions(responseFilters.data.diseases),
  locations: {
    provinces: createSelectOptions(responseFilters.data.locations.provinces),
    cities: createSelectOptions(responseFilters.data.locations.cities)
  },
  news: createSelectOptions(responseFilters.data.news),
});

const setInitialFilterValues = (
  initialFilterState: FilterStateDashboard,
  options: FilterOptions,
  setters: {
    setDiseases: (value: SelectOption[]) => void;
    setLocations: (value: SelectOption[]) => void;
    setNews: (value: SelectOption[]) => void;
    setLevelOfAlertness: (value: number) => void;
    setStartDate: (value: Date | null) => void;
    setEndDate: (value: Date | null) => void;
    setBatch: (value: SelectOption | null) => void;
  },
  batchOptions: SelectOption[]
) => {
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

  setInitialValues(initialFilterState.diseases, options.diseases, setters.setDiseases);
  
  // Handle locations from both provinces and cities
  const locationOptions: SelectOption[] = [];
  
  // Add provinces
  initialFilterState.locations.provinces.forEach(province => {
    const option = options.locations.provinces.find(opt => opt.value === province);
    if (option) {
      locationOptions.push(option);
    }
  });
  
  // Add cities
  initialFilterState.locations.cities.forEach(city => {
    const option = options.locations.cities.find(opt => opt.value === city);
    if (option) {
      locationOptions.push(option);
    }
  });
  
  setters.setLocations(locationOptions);
  
  setInitialValues(initialFilterState.portals, options.news, setters.setNews);
  
  setters.setLevelOfAlertness(initialFilterState.level_of_alertness || 0);
  setters.setStartDate(initialFilterState.start_date ? new Date(initialFilterState.start_date) : null);
  setters.setEndDate(initialFilterState.end_date ? new Date(initialFilterState.end_date) : null);

  if (initialFilterState.batch) {
    const batchOption = batchOptions.find(opt => opt.value === initialFilterState.batch);
    if (batchOption) {
      setters.setBatch(batchOption);
    } else {
      setters.setBatch({
        value: initialFilterState.batch,
        label: initialFilterState.batch,
      });
    }
  } else if (initialFilterState.batch === null) {
    setters.setBatch(null);
  }
};

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
    locations: {
      provinces: [],
      cities: [],
    },
    news: [],
  });
  const [batchOptions, setBatchOptions] = useState<SelectOption[]>([ALL_UPLOADS_OPTION]);
  const [selectedBatch, setSelectedBatch] = useState<SelectOption | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    let isActive = true;

    async function fetchFilters() {
      setIsLoadingFilters(true);
      try {
        const responseFilters = await fetchFilterOptions(apiFilterOptions);
        if (!isActive) {
          return;
        }

        const options = createFilterOptions(responseFilters);
        setFilterOptions(options);

        let batchSelectOptions = [ALL_UPLOADS_OPTION];

        try {
          const batches = await mapApi.getExpertBatches();
          if (!isActive) {
            return;
          }

          batchSelectOptions = createBatchSelectOptions(batches);
        } catch (batchError) {
          console.error("Error fetching expert batches:", batchError);
          if (isActive) {
            onError("Failed to load CSV uploads. Please try again.");
          }
        }

        if (!isActive) {
          return;
        }

        if (
          initialFilterState?.batch &&
          !batchSelectOptions.some((option) => option.value === initialFilterState.batch)
        ) {
          batchSelectOptions = [
            ...batchSelectOptions,
            { value: initialFilterState.batch, label: initialFilterState.batch },
          ];
        }

        setBatchOptions(batchSelectOptions);

        if (initialFilterState) {
          setInitialFilterValues(
            initialFilterState,
            options,
            {
              setDiseases: setSelectedDiseases,
              setLocations: setSelectedLocations,
              setNews: setSelectedNews,
              setLevelOfAlertness: setSelectedLevelOfAlertness,
              setStartDate: setSelectedStartDate,
              setEndDate: setSelectedEndDate,
              setBatch: setSelectedBatch,
            },
            batchSelectOptions
          );
        }
      } catch (error) {
        if (isActive) {
          handleError(error, onError);
        }
      } finally {
        if (isActive) {
          setIsLoadingFilters(false);
        }
      }
    }

    fetchFilters();

    return () => {
      isActive = false;
    };
  }, [apiFilterOptions, initialFilterState, onError]);

  const handleDiseaseChange = (newValue: MultiValue<SelectOption>) => {
    handleSelectChange(newValue, selectedDiseases, filterOptions.diseases, setSelectedDiseases);
  };

  const handleLocationChange = (newValue: MultiValue<SelectOption>) => {
    const allLocations = [
      ...filterOptions.locations.provinces,
      ...filterOptions.locations.cities
    ];
    handleSelectChange(newValue, selectedLocations, allLocations, setSelectedLocations);
  };

  const handleNewsChange = (newValue: MultiValue<SelectOption>) => {
    handleSelectChange(newValue, selectedNews, filterOptions.news, setSelectedNews);
  };

  const handleBatchChange = (newValue: SingleValue<SelectOption>) => {
    if (!newValue) {
      setSelectedBatch(null);
      return;
    }

    if (newValue.value === "") {
      setSelectedBatch(newValue);
      return;
    }

    setSelectedBatch(newValue);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const filterState: FilterStateDashboard = createFilterState(
        selectedDiseases,
        selectedLocations,
        selectedNews,
        selectedLevelOfAlertness,
        selectedStartDate,
        selectedEndDate,
        selectedBatch,
        filterOptions
      );

      console.log("Submitting filter state:", filterState);

      if (onSubmitFilterState) {
        onSubmitFilterState(filterState);
      }
    } catch (error) {
      console.error("Error submitting filter:", error);
      onError("Failed to apply filter. Please try again.");
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
    setSelectedBatch(null);
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
          options={[
            { value: "all", label: "Pilih Semua" },
            {
              label: "Provinsi",
              options: filterOptions.locations.provinces
            },
            {
              label: "Kota/Kabupaten",
              options: filterOptions.locations.cities
            }
          ]}
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

        <SingleSelectField
          label="CSV Upload"
          options={batchOptions}
          value={selectedBatch}
          onChange={handleBatchChange}
          instanceId="batch-select"
          placeholder="All uploads"
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

"use client"
import { useEffect, useState, FormEvent } from "react";
import Select, { MultiValue, SingleValue, components } from "react-select";
import DatePicker from "react-datepicker";
import type { FilterState, ExpertBatch } from "../../../types";
import "react-datepicker/dist/react-datepicker.css";
import { mapApi } from "../../../services/api";

// Define option type for Select components
interface SelectOption {
  value: string;
  label: string;
}

interface FilterOptions {
  diseases: SelectOption[];
  locations: {
    provinces: SelectOption[];
    cities: SelectOption[];
  };
  news: SelectOption[];
}

interface MultiSelectFormProps {
  onSubmitFilterState?: (filterState: FilterState) => void;
  apiFilterOptions?: string;
  initialFilterState?: FilterState | null;
  onError: (message: string) => void;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;
const ALL_UPLOADS_OPTION = { value: "", label: "All uploads" };

const createBatchSelectOptions = (batches: ExpertBatch[]) => {
  const batchOptions = batches.map((batch) => ({
    value: batch.id,
    label: batch.filename || batch.id,
  }));

  return [ALL_UPLOADS_OPTION, ...batchOptions];
};

// Custom Group component for locations
const Group = (props: any) => (
  <div>
    <components.Group {...props}>
      <div className="px-2 py-1 bg-gray-100 text-sm font-medium">
        {props.label}
      </div>
      {props.children}
    </components.Group>
  </div>
);

const findLocation = (location: string, provinces: SelectOption[], cities: SelectOption[]): SelectOption => {
  const province = provinces.find((opt: SelectOption) => opt.value === location);
  if (province) return province;

  const city = cities.find((opt: SelectOption) => opt.value === location);
  return city ?? { value: location, label: location };
};

// Main function to set selected locations
const getSelectedLocations = (
  locations: string[],
  provinces: SelectOption[],
  cities: SelectOption[]
): SelectOption[] => {
  return locations.map(location => findLocation(location, provinces, cities));
};

export default function MultiSelectForm({
  apiFilterOptions = `${API_BASE_URL}/api/filters/`, 
  onSubmitFilterState, 
  initialFilterState,
  onError
}: MultiSelectFormProps) {
  const [selectedDiseases, setSelectedDiseases] = useState<SelectOption[]>([]);
  const [selectedNews, setSelectedNews] = useState<SelectOption[]>([]);
  const [selectedLocations, setSelectedLocations] = useState<SelectOption[]>([]);
  const [selectedLevelOfAlertness, setSelectedLevelOfAlertness] = useState(0);
  const [selectedStartDate, setSelectedStartDate] = useState<Date | null>(null);
  const [selectedEndDate, setSelectedEndDate] = useState<Date | null>(null);
  const [batchOptions, setBatchOptions] = useState<SelectOption[]>([ALL_UPLOADS_OPTION]);
  const [selectedBatch, setSelectedBatch] = useState<SelectOption | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingFilters, setIsLoadingFilters] = useState(false);
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    diseases: [],
    locations: {
      provinces: [],
      cities: []
    },
    news: [],
  });

  // Preselect batch if provided so mocked selects pick it up even before options arrive
  useEffect(() => {
    if (initialFilterState?.batch) {
      setSelectedBatch({
        value: initialFilterState.batch,
        label: initialFilterState.batch,
      });
    }
  }, [initialFilterState?.batch]);
  
  const handleReset = () => {
    setSelectedDiseases([]);
    setSelectedNews([]);
    setSelectedLocations([]);
    setSelectedLevelOfAlertness(0);
    setSelectedStartDate(null);
    setSelectedEndDate(null);
    setSelectedBatch(null);
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
      end_date: selectedEndDate,
      batch: selectedBatch && selectedBatch.value !== "" ? selectedBatch.value : null
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
  }

  useEffect(() => {
    let isActive = true;

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

        if (!response.ok) {
          throw new Error("Failed to fetch filter options");
        }

        const responseFilters = await response.json();
        if (!isActive) return;

        const options = {
          diseases: [{ value: "all", label: "Pilih Semua" }, ...responseFilters.data.diseases],
          locations: {
            provinces: responseFilters.data.locations.provinces,
            cities: responseFilters.data.locations.cities,
          },
          news: [{ value: "all", label: "Pilih Semua" }, ...responseFilters.data.news],
        };

        setFilterOptions(options);

        let batchSelectOptions = [ALL_UPLOADS_OPTION];
        try {
          const batches = await mapApi.getExpertBatches();
          if (!isActive) return;
          batchSelectOptions = createBatchSelectOptions(batches);
        } catch (batchError) {
          console.error("Error fetching expert batches:", batchError);
          if (isActive) {
            onError("Failed to load CSV uploads. Please try again.");
          }
        }

        if (!isActive) return;

        if (initialFilterState?.batch) {
          if (!batchSelectOptions.some((option) => option.value === initialFilterState.batch)) {
            batchSelectOptions = [
              ...batchSelectOptions,
              { value: initialFilterState.batch, label: initialFilterState.batch },
            ];
          }
        }

        setBatchOptions(batchSelectOptions);

        if (initialFilterState) {
          setSelectedDiseases(
            initialFilterState.diseases.map((disease) =>
              options.diseases.find((option) => option.value === disease) || {
                value: disease,
                label: disease,
              }
            )
          );

          setSelectedLocations(
            getSelectedLocations(initialFilterState.locations, options.locations.provinces, options.locations.cities)
          );

          setSelectedNews(
            initialFilterState.portals.map((portal) =>
              options.news.find((option) => option.value === portal) || {
                value: portal,
                label: portal,
              }
            )
          );

          setSelectedLevelOfAlertness(initialFilterState.level_of_alertness || 0);
          setSelectedStartDate(initialFilterState.start_date ? new Date(initialFilterState.start_date) : null);
          setSelectedEndDate(initialFilterState.end_date ? new Date(initialFilterState.end_date) : null);

          if (initialFilterState.batch) {
            const matchingBatch = batchSelectOptions.find(
              (option) => option.value === initialFilterState.batch
            );
            setSelectedBatch(
              matchingBatch || {
                value: initialFilterState.batch,
                label: initialFilterState.batch,
              }
            );
          } else if (initialFilterState.batch === null) {
            setSelectedBatch(null);
          }
        } else {
          setSelectedBatch(null);
        }
      } catch (error) {
        const msg =
          error instanceof Error && error.message
            ? error.message
            : "Failed to fetch filter options";
        console.error(msg);
        if (isActive) {
          onError("Failed to load the map. Please try again.");
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

  // Handle onChange for Select components
  const handleDiseaseChange = (newValue: MultiValue<SelectOption>) => {
    if (newValue.some((option) => option.value === "all")) {
      if (selectedDiseases.length === filterOptions.diseases.length - 1) {
        setSelectedDiseases([]);
      } else {
        setSelectedDiseases(filterOptions.diseases.slice(1));
      }
    } else {
      setSelectedDiseases(newValue as SelectOption[]);
    }
  };

  const handleLocationChange = (newValue: MultiValue<SelectOption>) => {
    if (newValue.some((option) => option.value === "all")) {
      const allLocations = [
        ...filterOptions.locations.provinces,
        ...filterOptions.locations.cities
      ];
      if (selectedLocations.length === allLocations.length) {
        setSelectedLocations([]);
      } else {
        setSelectedLocations(allLocations);
      }
    } else {
      setSelectedLocations(newValue as SelectOption[]);
    }
  };

  const handleNewsChange = (newValue: MultiValue<SelectOption>) => {
    if (newValue.some((option) => option.value === "all")) {
      if (selectedNews.length === filterOptions.news.length - 1) {
        setSelectedNews([]);
      } else {
        setSelectedNews(filterOptions.news.slice(1));
      }
    } else {
      setSelectedNews(newValue as SelectOption[]);
    }  
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

  // Group locations into provinces and cities
  const locationGroups = [
    { value: "all", label: "Pilih Semua" },
    {
      label: "Provinsi",
      options: filterOptions.locations.provinces
    },
    {
      label: "Kota/Kabupaten",
      options: filterOptions.locations.cities
    }
  ];

  if (isLoadingFilters) {
    return (
      <div className="max-w-lg mx-auto mt-10 p-4">
        <div className="flex flex-col items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
          <p>Loading filter options...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto mt-10">
      <form data-testid="map-filter-select" onSubmit={handleSubmit} className="space-y-4">
        {/* diseases */}
        <div>
          <label className="block text-sm font-medium">Jenis Penyakit</label>
          <Select
            options={filterOptions.diseases}
            isMulti
            value={selectedDiseases}
            onChange={handleDiseaseChange}
            className="mt-1 text-sm"
          />
        </div>
        {/* locations */}
        <div>
          <label className="block text-sm font-medium">Lokasi</label>
          <Select
            options={locationGroups}
            isMulti
            value={selectedLocations}
            onChange={handleLocationChange}
            className="mt-1 text-sm"
            components={{ Group }}
            styles={{
              menuList: (base) => ({
                ...base,
                maxHeight: '400px',
              }),
              group: (base) => ({
                ...base,
                paddingTop: 0,
                paddingBottom: 0,
                '&:not(:last-child)': {
                  paddingBottom: '8px',
                  marginBottom: '8px',
                  borderBottom: '1px solid #e5e7eb',
                }
              }),
              groupHeading: (base) => ({
                ...base,
                padding: 0,
                margin: 0,
              }),
              menu: (base) => ({
                ...base,
                zIndex: 9999
              }),
              option: (base) => ({
                ...base,
                padding: '8px 12px'
              })
            }}
          />
        </div>
        {/* news */}
        <div>
          <label className="block text-sm font-medium">Sumber Berita</label>
          <Select
            options={filterOptions.news}
            isMulti
            value={selectedNews}
            onChange={handleNewsChange}
            className="mt-1 text-sm"
          />
        </div>
        {/* csv batches */}
        <div>
          <label className="block text-sm font-medium">CSV Upload</label>
          <Select
            options={batchOptions}
            value={selectedBatch}
            onChange={handleBatchChange}
            className="mt-1 text-sm"
            isClearable
          />
        </div>
        {/* level of alertness */}
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
                    star <= selectedLevelOfAlertness ? "text-yellow-400" : "text-gray-300"
                  }`}
                  onClick={() => setSelectedLevelOfAlertness(star)}
                >
                  {star <= selectedLevelOfAlertness ? "★" : "☆"}
                </button>
              ))}
            </div>
          </div>
        </div>
        {/* date range */}
        <div>
          <span className="block text-sm font-medium mb-1">Tanggal</span>
          <div className="flex items-center gap-2 text-sm">
            <DatePicker
              selected={selectedStartDate}
              onChange={(date: Date | null) => setSelectedStartDate(date)}
              selectsStart
              startDate={selectedStartDate}
              endDate={selectedEndDate}
              maxDate={selectedEndDate || undefined}
              placeholderText="Mulai"
              className="border p-2 rounded-md w-full"
            />
            <span>-</span>
            <DatePicker
              selected={selectedEndDate}
              onChange={(date: Date | null) => setSelectedEndDate(date)}
              selectsEnd
              startDate={selectedStartDate}
              endDate={selectedEndDate}
              minDate={selectedStartDate || undefined}
              placeholderText="Selesai"
              className="border p-2 rounded-md w-full"
            />
          </div>
        </div>
        {/* submit */}
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
            {isSubmitting ? "Mengirim..." : "Kirim Data"}
          </button>
        </div>
      </form>
    </div>
  );
}

export type { FilterState };

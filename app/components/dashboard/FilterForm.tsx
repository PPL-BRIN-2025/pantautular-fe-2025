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
            diseases: [{ value: "all", label: "Pilih Semua" }, ...responseFilters.data.diseases],
            locations: [{ value: "all", label: "Pilih Semua" }, ...responseFilters.data.locations],
            news: [{ value: "all", label: "Pilih Semua" }, ...responseFilters.data.news],
          };
          setFilterOptions(options);
          
          if (initialFilterState) {
            setSelectedDiseases(
              initialFilterState.diseases.map(disease => 
                options.diseases.find(option => option.value === disease) || 
                { value: disease, label: disease }
              )
            );
            
            setSelectedLocations(
              initialFilterState.locations.map(location => 
                options.locations.find(option => option.value === location) || 
                { value: location, label: location }
              )
            );
            
            setSelectedNews(
              initialFilterState.portals.map(portal => 
                options.news.find(option => option.value === portal) || 
                { value: portal, label: portal }
              )
            );
            
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
      if (selectedLocations.length === filterOptions.locations.length - 1) {
        setSelectedLocations([]);
      } else {
        setSelectedLocations(filterOptions.locations.slice(1));
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

  if (isLoadingFilters) {
    return (
      <div className="flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
        <p>Loading filter options...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden w-full max-w-md">
      <div className="bg-blue-500 px-6 py-4">
        <h2 className="text-white text-lg font-semibold">Filter Informasi Penyakit Menular</h2>
      </div>
      <form data-testid="map-filter-select" onSubmit={handleSubmit} className="space-y-4 p-6">
        <div>
          <label className="block text-sm font-medium">Jenis Penyakit</label>
          <Select
            options={filterOptions.diseases}
            isMulti
            value={selectedDiseases}
            onChange={handleDiseaseChange}
            className="mt-1 text-sm"
            instanceId="disease-select"
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Lokasi</label>
          <Select
            options={filterOptions.locations}
            isMulti
            value={selectedLocations}
            onChange={handleLocationChange}
            className="mt-1 text-sm"
            instanceId="location-select"
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Sumber Berita</label>
          <Select
            options={filterOptions.news}
            isMulti
            value={selectedNews}
            onChange={handleNewsChange}
            className="mt-1 text-sm"
            instanceId="news-select"
          />
        </div>

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
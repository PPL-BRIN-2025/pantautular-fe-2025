"use client";

import { useEffect, useMemo, useState } from "react";
import { IndonesiaMap } from "../components/IndonesiaMap";
import { useLocations } from "../../hooks/useLocations";
import { useMapError } from "../../hooks/useMapError";
import { defaultMapConfig } from "../../data/indonesiaLocations";
import Navbar from "../components/Navbar";
import MapLoadErrorPopup from "../components/MapLoadErrorPopup";
import NoDataPopup from "../components/NoDataPopup"; 
import MultiSelectForm from "../components/filter/MultiSelectForm";
import FilterButton from "../components/floating_buttons/FilterButton";
import TimeRangeFilter from "../components/filter/TimeRangeFilter";
import { FilterState } from "../../types";
import SpatialComparisonPanel from "../components/spatial/SpatialComparisonPanel";

const DEFAULT_FILTER_STATE: FilterState = {
  diseases: [],
  locations: [],
  level_of_alertness: 0,
  portals: [],
  start_date: null,
  end_date: null,
  batch: null,
};

export default function MapPage() {
  const [filterState, setFilterState] = useState<FilterState>(DEFAULT_FILTER_STATE);
  const [refreshToken, setRefreshToken] = useState(0);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(false);
  const [autoRefreshInterval, setAutoRefreshInterval] = useState(30000);
  const { data: locations, isLoading, error, provinceHumidityData, provinceTemperatureData, provincePrecipitationData, provinceSeverityData } = useLocations(filterState, refreshToken);
  const { error: mapError, setError: setMapError, clearError } = useMapError();
  const [isEmptyData, setIsEmptyData] = useState(false);
  const [isFilterVisible, setIsFilterVisible] = useState(false);
  const timeRange = useMemo(
    () => ({
      start: filterState.start_date ?? null,
      end: filterState.end_date ?? null,
    }),
    [filterState.start_date, filterState.end_date]
  );

  useEffect(() => {
    if (error) {
      console.log(error.message)
      if (error.message.includes("No case locations found") ||
          error.message.includes("HTTP error! status: 404")
      ) {
        setIsEmptyData(true);
      } else {
        setMapError(error.message);
      }
    }
  }, [error, setMapError]);

  useEffect(() => {
    if (!mapError && !error && locations != null && locations.length === 0 && !isLoading) {
      setIsEmptyData(true);
    }
  }, [locations, isLoading, mapError, error]);

  useEffect(() => {
    if (!autoRefreshEnabled) {
      return;
    }
    const timer = setInterval(() => {
      setRefreshToken((prev) => prev + 1);
    }, autoRefreshInterval);
    return () => clearInterval(timer);
  }, [autoRefreshEnabled, autoRefreshInterval]);

  const toggleFilterVisibility = () => {
    /* istanbul ignore next */
    setIsFilterVisible(prev => !prev);
  };

  const triggerManualRefresh = () => {
    setRefreshToken((prev) => prev + 1);
  };

  if (isLoading) {
    return (
      <>
        <Navbar />
        <div className="flex items-center justify-center h-[calc(100vh-5rem)]">
          Loading map data...
        </div>
      </>
    );
  }

  let popup = null;
  if (mapError) {
    popup = <MapLoadErrorPopup message={mapError} onClose={clearError} />;
  } else if (isEmptyData) {
    popup = <NoDataPopup onClose={() => setIsEmptyData(false)} />;
  }
  /* istanbul ignore next */
  return (
    <>
      <Navbar />
      <div className="w-full min-h-[calc(100vh-5rem)] relative">
        {/* Changed from absolute to fixed positioning with greater top value to account for navbar */}
        <div className="fixed top-[calc(5rem+1rem)] left-4 z-30 flex flex-col gap-3">
          <FilterButton
            onClick={toggleFilterVisibility}
            isActive={isFilterVisible}
          />
          <div className="bg-white/90 shadow-lg rounded-lg p-3 max-w-xs text-sm space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="font-semibold">Auto-refresh</span>
              <label className="flex items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  checked={autoRefreshEnabled}
                  onChange={(e) => setAutoRefreshEnabled(e.target.checked)}
                  data-testid="auto-refresh-toggle"
                />
                Aktif
              </label>
            </div>
            <label className="flex items-center gap-2 text-xs">
              <span>Interval</span>
              <select
                className="border rounded p-1 flex-1"
                value={autoRefreshInterval}
                onChange={(e) => setAutoRefreshInterval(Number(e.target.value))}
                data-testid="auto-refresh-interval"
              >
                <option value={15000}>15 detik</option>
                <option value={30000}>30 detik</option>
                <option value={60000}>60 detik</option>
              </select>
            </label>
            <button
              type="button"
              onClick={triggerManualRefresh}
              className="w-full bg-blue-500 text-white py-1 rounded-md"
              data-testid="manual-refresh"
            >
              Muat ulang peta
            </button>
          </div>
        </div>

        {/* Conditionally render the filter form */}
        {isFilterVisible && (
          <div
            className="fixed top-[calc(5rem+5rem)] left-4 bg-white shadow-lg rounded-lg p-4 z-20 max-w-lg overflow-auto max-h-[70vh]"
            data-testid="filter-form"
          >
            <MultiSelectForm
              onSubmitFilterState={(state) => {
                setFilterState((prev) => ({
                  ...prev,
                  ...state,
                }));
              }}
              initialFilterState={filterState}
              onError={
                (message) => setMapError(message)
              }
            />
          </div>
        )}
        
        {/* Always render the map container */}
        <div className="relative w-full h-[calc(100vh-6rem)]">
          {isLoading && ( 
            <div className="absolute inset-0 bg-white bg-opacity-70 flex items-center justify-center z-10">
              <div className="flex flex-col items-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
                <p className="text-lg font-medium">Loading map data...</p>
              </div>
            </div>
          )}
          
          {popup}
          <IndonesiaMap 
            locations={locations || []} 
            config={defaultMapConfig} 
            width="100%"
            height="100%"
            onError={(message) => setMapError(message)}
            isFilterVisible={isFilterVisible}
            onFilterToggle={toggleFilterVisibility}
            provinceHumidityData={provinceHumidityData}
            provinceTemperatureData={provinceTemperatureData}
            provincePrecipitationData={provincePrecipitationData}
            provinceSeverityData={provinceSeverityData}
            timeFilter={
              <TimeRangeFilter
                value={timeRange}
                onApply={(range) => {
                  setFilterState((prev) => ({
                    ...prev,
                    start_date: range.start,
                    end_date: range.end,
                  }));
                }}
                onReset={() => {
                  setFilterState((prev) => ({
                    ...prev,
                    start_date: null,
                    end_date: null,
                  }));
                }}
              />
            }
          />
        </div>
        <div className="w-full px-4 py-6 bg-gray-50">
          <SpatialComparisonPanel
            baseFilters={filterState}
            refreshToken={refreshToken}
            onError={(message) => setMapError(message)}
            provinceHumidityData={provinceHumidityData}
            provincePrecipitationData={provincePrecipitationData}
            provinceSeverityData={provinceSeverityData}
            provinceTemperatureData={provinceTemperatureData}
          />
        </div>
      </div>
    </>
  );
}

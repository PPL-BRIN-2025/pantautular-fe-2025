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
  const [showAutoRefreshPanel, setShowAutoRefreshPanel] = useState(false);
  const [showSpatialComparison, setShowSpatialComparison] = useState(false);
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
        {/* Filter trigger */}
        <div className="fixed top-[calc(5rem+1rem)] left-4 z-30">
          <FilterButton
            onClick={toggleFilterVisibility}
            isActive={isFilterVisible}
          />
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
          {/* Spatial comparison toggle */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30">
            <button
              type="button"
              className="bg-white/90 shadow rounded-full px-4 py-2 text-sm font-semibold border"
              onClick={() => setShowSpatialComparison((prev) => !prev)}
              data-testid="spatial-toggle"
            >
              {showSpatialComparison ? "Tutup Peta Berdampingan" : "Perbandingan Spasial"}
            </button>
          </div>
          {/* Spatial comparison overlay */}
          {showSpatialComparison ? (
            <div className="absolute inset-x-4 top-16 z-30 pointer-events-auto">
              <div className="bg-white shadow-2xl rounded-xl p-4 max-h-[70vh] overflow-y-auto border border-gray-200">
                <SpatialComparisonPanel
                  baseFilters={filterState}
                  refreshToken={refreshToken}
                  onError={(message) => setMapError(message)}
                  provinceHumidityData={provinceHumidityData}
                  provincePrecipitationData={provincePrecipitationData}
                  provinceSeverityData={provinceSeverityData}
                  provinceTemperatureData={provinceTemperatureData}
                  maxRegions={2}
                  overlayMode
                  onClose={() => setShowSpatialComparison(false)}
                />
              </div>
            </div>
          ) : null}
          {/* Auto-refresh toggle near bottom-left */}
          <div className="absolute bottom-16 left-4 z-30 pointer-events-auto">
            <button
              type="button"
              className="bg-white/90 shadow rounded-md px-3 py-2 text-sm font-semibold border"
              onClick={() => setShowAutoRefreshPanel((prev) => !prev)}
              data-testid="auto-refresh-toggle-button"
            >
              {showAutoRefreshPanel ? "Tutup Auto Refresh" : "Auto Refresh"}
            </button>
            {showAutoRefreshPanel ? (
              <div className="mt-2 bg-white/95 shadow-lg rounded-lg p-3 w-64 text-sm space-y-2 border border-gray-200">
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
            ) : null}
          </div>
        </div>
      </div>
    </>
  );
}

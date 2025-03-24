"use client";

import { useEffect, useState } from "react";
import { IndonesiaMap } from "../components/IndonesiaMap";
import { useLocations } from "../../hooks/useLocations";
import { useMapError } from "../../hooks/useMapError";
import { defaultMapConfig } from "../../data/indonesiaLocations";
import Navbar from "../components/Navbar";
import MapLoadErrorPopup from "../components/MapLoadErrorPopup";
import NoDataPopup from "../components/NoDataPopup"; 
import MultiSelectForm from "../components/filter/MultiSelectForm";
import FilterButton from "../components/floating_buttons/FilterButton";
import { FilterState } from "../../types";

export default function MapPage() {
  const [filterState, setFilterState] = useState<FilterState | null>(null);
  const { data: locations, isLoading, error } = useLocations(filterState as FilterState);
  const { error: mapError, setError: setMapError, clearError } = useMapError();
  const [isEmptyData, setIsEmptyData] = useState(false);
  const [isFilterVisible, setIsFilterVisible] = useState(false);

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

  const toggleFilterVisibility = () => {
    /* istanbul ignore next */
    setIsFilterVisible(prev => !prev);
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
      <div className="w-full h-[calc(100vh-5rem)] relative">
        {/* Changed from absolute to fixed positioning with greater top value to account for navbar */}
        <div className="fixed top-[calc(5rem+1rem)] left-4 z-30">
          <FilterButton 
            onClick={toggleFilterVisibility}
            isActive={isFilterVisible}
          />
        </div>

        {/* Conditionally render the filter form */}
        {isFilterVisible && (
          <div className="fixed top-[calc(5rem+5rem)] left-4 bg-white shadow-lg rounded-lg p-4 z-20 max-w-lg overflow-auto max-h-[70vh]">
            <MultiSelectForm
              onSubmitFilterState={(state) => {

                setFilterState(state);
                // Optional: close filter form after submission
                // setIsFilterVisible(false);
              }}
              initialFilterState={filterState}
              onError={
                (message) => setMapError(message)
              }
            />
          </div>
        )}
        
        {/* Always render the map container */}
        <div className="relative w-full h-full">
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
          />
        </div>
      </div>
    </>
  );
}
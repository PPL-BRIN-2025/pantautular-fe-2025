import React, { useState, useCallback, useEffect, useRef } from "react";
import { useUserLocation } from "../../hooks/useUserLocation";
import { useIndonesiaMap } from "../../hooks/useIndonesiaMap";
import { MapLocation, MapConfig } from "../../types";
import { LocationError } from "../../services/LocationService";
import LocationPermissionPopup from "./LocationPermissionPopup";
import LocationErrorPopup from "./LocationErrorPopup"
import DashboardButton from "./floating_buttons/DashboardButton";
import WarningButton from "./floating_buttons/WarningButton";
import LocationButton from "./floating_buttons/LocationButton";
import {MapButton} from "./floating_buttons/MapButton";
import { useMapStore } from "../../store/store";

interface IndonesiaMapProps {
  locations: MapLocation[];
  config?: Partial<MapConfig>;
  height?: string;
  width?: string;
  onError: (message: string) => void;
  isFilterVisible?: boolean;
  onFilterToggle?: () => void;
}

export const IndonesiaMap: React.FC<IndonesiaMapProps> = ({
  locations,
  config = {},
  height = "100vh",
  width = "100vw",
  onError,
}) => {
  const mapContainerId = "chartdiv";
  const [showPermissionPopup, setShowPermissionPopup] = useState(false);
  const [locationError, setLocationError] = useState<LocationError | null>(null);
  const mapInitialized = useRef(false);
  
  const fullConfig: MapConfig = {
    zoomLevel: config.zoomLevel ?? 2,
    centerPoint: config.centerPoint ?? { longitude: 113.9213, latitude: 0.7893 },
  };
  
  // Custom dependency array that excludes isFilterVisible to prevent map re-rendering
  // when only the filter visibility changes
  const { mapService } = useIndonesiaMap(
    mapContainerId, 
    locations, 
    fullConfig, 
    onError,
    mapInitialized.current
  );
  
  // Set mapInitialized to true after first render
  useEffect(() => {
    /*istanbul ignore next*/
    if (!mapInitialized.current && mapService) {
      mapInitialized.current = true;
    }
  }, [mapService]);

  // Fungsi untuk menangani zoom ke lokasi user
  const handleLocationSuccess = useCallback((latitude: number, longitude: number) => {
    console.log(`Zooming to user location: ${latitude}, ${longitude}`);
    
    /*istanbul ignore next*/
    if (mapService) {
      mapService.zoomToLocation(latitude, longitude);
    }
  }, [mapService]);

  // Gunakan useUserLocation untuk menangani izin lokasi
  const { handleAllow, handleDeny } = useUserLocation(
    setShowPermissionPopup,
    setLocationError,
    handleLocationSuccess,
    /*istanbul ignore next*/
    () => setLocationError({ type: "PERMISSION_DENIED", message: "Anda menolak izin lokasi." })
  );
  const countSelectedPoints = useMapStore((state) => state.countSelectedPoints);

  return (
    <div className="relative w-full h-full">
      <div
        id={mapContainerId}
        data-testid="map-container"
        style={{
          width,
          height,
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0
        }}
      />
      
      {/* Changed from absolute to fixed positioning with greater top value to account for navbar */}
      <div className="fixed top-[calc(5rem+1rem)] left-32 z-20 flex gap-3">
        <LocationButton onClick={() => setShowPermissionPopup(true)} />
        <WarningButton />
      </div>
      
      {/* Changed from absolute to fixed positioning with greater top value to account for navbar */}
      <div className="fixed top-[calc(5rem+1rem)] right-5 z-20 flex gap-2">
        <DashboardButton />
        <MapButton />
      </div>
      
      {/* Popup izin lokasi */}
      <LocationPermissionPopup
        open={showPermissionPopup}
        onClose={() => setShowPermissionPopup(false)}
        onAllow={handleAllow}
        onDeny={handleDeny}
      />
      <div className="fixed bottom-5 left-5 z-20 bg-black/60 text-white text-lg font-bold p-2 rounded-lg">
        {`Points Visible: ${countSelectedPoints}`}
      </div>
      
      {/* Popup error lokasi */}
      {/*istanbul ignore next*/}
      {locationError && (
        <LocationErrorPopup
          open={!!locationError}
          errorType={locationError.type}
          onOpenChange={/*istanbul ignore next*/() => setLocationError(null)}
        />
      )}
    </div>
  );
};
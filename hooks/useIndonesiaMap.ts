import { useEffect, useRef, useState } from "react";
import { MapChartService } from "../services/mapChartService";
import { MapLocation, MapConfig, ProvinceData } from "../types";
import { useMapStore } from "../store/store";

export function useIndonesiaMap(
  containerId: string, 
  locations: MapLocation[], 
  config: MapConfig, 
  provinceHumidityData: ProvinceData[],
  provinceTemperatureData: ProvinceData[],
  provincePrecipitationData: ProvinceData[],
  provinceSeverityData: ProvinceData[],
  onError: (message: string) => void,
  initialized = false,
  options?: {
    shareStore?: boolean;
    syncStore?: boolean;
  }
) {
  const mapServiceRef = useRef<MapChartService | null>(null);
  const [mapService, setMapService] = useState<MapChartService | null>(null);
  const locationsRef = useRef<MapLocation[]>(locations);
  const setMapServiceStore = useMapStore((state) => state.setMapService);
  const shareStore = options?.shareStore ?? true;
  const syncStore = options?.syncStore ?? true;
  
  // Set up the map once
  useEffect(() => {
    // If the map is already initialized and we have a service reference, don't reinitialize
    /* istanbul ignore next */
    if (initialized && mapServiceRef.current) {
      return;
    }
    
    const service = new MapChartService(onError, { syncStore });
    
    try {
      service.initialize(containerId, config);
      service.populateLocations(locations);
      service.populateProvinceHumidityData(provinceHumidityData);
      service.populateProvincePrecipitationData(provincePrecipitationData);
      service.populateProvinceTemperatureData(provinceTemperatureData);
      service.populateProvinceSeverityData(provinceSeverityData);
      mapServiceRef.current = service;
      setMapService(service);
      if (shareStore) {
        setMapServiceStore(service); // Update the Zustand store
      }
    } catch (error) {
      console.error("Failed to initialize map:", error);
    }
    
    return () => {
      /* istanbul ignore next */
      if (!initialized && mapServiceRef.current) {
        mapServiceRef.current.dispose();
        mapServiceRef.current = null;
        if (shareStore) {
          setMapServiceStore(null); // Clear the service from store on cleanup
        }
      }
    };
  }, [containerId, config, initialized, onError, setMapServiceStore, shareStore, syncStore]);
  
  // Update locations when they change, without reinitializing the map
  useEffect(() => {
    // Skip if locations haven't changed
    if (!mapServiceRef.current || locations === locationsRef.current) {
      return;
    }
    
    // Update reference
    locationsRef.current = locations;
    
    // Clear and repopulate locations
    try {
      mapServiceRef.current.populateLocations(locations);
    } catch (error) {
      /*istanbul ignore next*/
      console.error("Failed to update map locations:", error);
    }
  }, [locations]);
  
  return { mapService: mapServiceRef.current };
}

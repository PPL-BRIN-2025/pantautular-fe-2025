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
  onError: (message: string) => void,
  initialized = false
) {
  const mapServiceRef = useRef<MapChartService | null>(null);
  const [mapService, setMapService] = useState<MapChartService | null>(null);
  const locationsRef = useRef<MapLocation[]>(locations);
  const setMapServiceStore = useMapStore((state) => state.setMapService);
  
  // Set up the map once
  useEffect(() => {
    // If the map is already initialized and we have a service reference, don't reinitialize
    /* istanbul ignore next */
    if (initialized && mapServiceRef.current) {
      return;
    }
    
    const service = new MapChartService(onError);
    
    try {
      service.initialize(containerId, config);
      service.populateLocations(locations);
      service.populateProvinceHumidityData(provinceHumidityData);
      mapServiceRef.current = service;
      setMapService(service);
      setMapServiceStore(service); // Update the Zustand store
    } catch (error) {
      console.error("Failed to initialize map:", error);
      // onError("Failed to initialize the map. Please try again.");
    }
    
    return () => {
      /* istanbul ignore next */
      if (!initialized && mapServiceRef.current) {
        mapServiceRef.current.dispose();
        mapServiceRef.current = null;
        setMapServiceStore(null); // Clear the service from store on cleanup
      }
    };
  }, [containerId, config, initialized, onError, setMapServiceStore]);
  
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
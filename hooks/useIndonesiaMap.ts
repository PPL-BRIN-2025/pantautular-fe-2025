import { useEffect, useRef, useState } from "react";
import { MapChartService } from "../services/mapChartService";
import { MapLocation, MapConfig } from "../types";

export function useIndonesiaMap(
  containerId: string, 
  locations: MapLocation[], 
  config: MapConfig, 
  onError: (message: string) => void,
  initialized = false
) {
  const mapServiceRef = useRef<MapChartService | null>(null);
  const [mapService, setMapService] = useState<MapChartService | null>(null);
  const locationsRef = useRef<MapLocation[]>(locations);
  
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
      mapServiceRef.current = service;
      setMapService(service);
    } catch (error) {
      console.error("Failed to initialize map:", error);
      onError("Failed to initialize the map. Please try again.");
    }
    
    return () => {
      /* istanbul ignore next */
      if (!initialized && mapServiceRef.current) {
        mapServiceRef.current.dispose();
        mapServiceRef.current = null;
      }
    };
  }, [containerId, config, initialized, onError]);
  
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
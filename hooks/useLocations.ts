import { useState, useEffect } from 'react';
import { MapLocation, FilterState } from '../types';
import { mapApi } from '../services/api';

export const useLocations = (filterState: FilterState) => {
  const [data, setData] = useState<MapLocation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [provinceHumidityData, setProvinceHumidityData] = useState<any[]>([]);
  const [provinceTemperatureData, setProvinceTemperatureData] = useState<any[]>([]);
  const [provincePrecipitationData, setProvincePrecipitationData] = useState<any[]>([]);
  const [provinceSeverityData, setProvinceSeverityData] = useState<any[]>([]);

  // Token validation function
  const isTokenValid = () => {
    const accessToken = localStorage.getItem('accessToken');
    if (!accessToken) return false;
    
    try {
      // Check if token is expired
      const tokenData = JSON.parse(atob(accessToken.split('.')[1]));
      const expiryTime = tokenData.exp * 1000; // Convert to milliseconds
      
      return Date.now() < expiryTime;
    } catch (err) {
      console.error('Error parsing token:', err);
      return false;
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const locations = await mapApi.getFilteredLocations(filterState);
        setData(locations);
        
        // Only fetch province data if token is valid
        if (isTokenValid()) {
          try {
            const humidityData = await mapApi.getProvinceData('humidity');
            const temperatureData = await mapApi.getProvinceData('temperature');
            const precipitationData = await mapApi.getProvinceData('precipitation');
            const severityData = await mapApi.getProvinceData('weighted-severity');
            
            // Set empty arrays as fallback if data is null or undefined
            setProvinceHumidityData(humidityData || []);
            setProvinceTemperatureData(temperatureData || []);
            setProvincePrecipitationData(precipitationData || []);
            setProvinceSeverityData(severityData || []);
          } catch (err) {
            console.error('Error fetching province data:', err);
            // Use empty arrays as fallback on error
            setProvinceHumidityData([]);
            setProvinceTemperatureData([]);
            setProvincePrecipitationData([]);
            setProvinceSeverityData([]);
          }
        } else {
          // Reset province data states with empty arrays
          setProvinceHumidityData([]);
          setProvinceTemperatureData([]);
          setProvincePrecipitationData([]);
          setProvinceSeverityData([]);
        }
      } catch (err) {
        console.error('Error in useLocations:', err);
        setError(err instanceof Error ? err : new Error('Failed to fetch locations'));
        // Optionally set fallback data
        setData([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [filterState]);

  return { data, isLoading, error, provinceHumidityData, provinceTemperatureData, provincePrecipitationData, provinceSeverityData };
};
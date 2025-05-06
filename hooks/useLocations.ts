import { useState, useEffect } from 'react';
import { MapLocation, FilterState } from '../types';
import { mapApi } from '../services/api';

export const useLocations = (filterState: FilterState) => {
  const [data, setData] = useState<MapLocation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [provinceHumidityData, setProvinceHumidityData] = useState<any>(null);
  const [provinceTemperatureData, setProvinceTemperatureData] = useState<any>(null);
  const [provincePrecipitationData, setProvincePrecipitationData] = useState<any>(null);
  const [provinceSeverityData, setProvinceSeverityData] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const locations = await mapApi.getFilteredLocations(filterState);
        const provinceHumidityData = await mapApi.getProvinceData('humidity');
        const provinceTemperatureData = await mapApi.getProvinceData('temperature');
        const provincePrecipitationData = await mapApi.getProvinceData('precipitation');
        const provinceSeverityData = await mapApi.getProvinceData('weighted-severity');
        setData(locations);
        setProvinceHumidityData(provinceHumidityData);
        setProvinceTemperatureData(provinceTemperatureData);
        setProvincePrecipitationData(provincePrecipitationData);
        setProvinceSeverityData(provinceSeverityData);
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
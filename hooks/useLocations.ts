import { useEffect, useRef, useState } from 'react';
import { MapLocation, FilterState } from '../types';
import { mapApi } from '../services/api';

const serializeFilterState = (state: FilterState): string => {
  const normalizeDate = (value: FilterState["start_date"]) => {
    if (!value) {
      return null;
    }
    if (value instanceof Date) {
      return value.toISOString();
    }
    return value;
  };

  return JSON.stringify({
    ...state,
    start_date: normalizeDate(state.start_date),
    end_date: normalizeDate(state.end_date),
  });
};

export const useLocations = (filterState: FilterState) => {
  const [data, setData] = useState<MapLocation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [provinceHumidityData, setProvinceHumidityData] = useState<any[]>([]);
  const [provinceTemperatureData, setProvinceTemperatureData] = useState<any[]>([]);
  const [provincePrecipitationData, setProvincePrecipitationData] = useState<any[]>([]);
  const [provinceSeverityData, setProvinceSeverityData] = useState<any[]>([]);
  const lastSerializedFilterRef = useRef<string | null>(null);

  // Token validation function
  const isTokenValid = () => {
    if (typeof localStorage === 'undefined') {
      return false;
    }

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
  
  // Function to handle auto logout
  const handleAutoLogout = () => {
    // Clear token and user data
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("user");
    }
    
    // Redirect to login page
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  };

  // Helper to check if an error is a token validation error
  const isTokenError = (err: any): boolean => {
    if (!err) return false;
    
    // Check for specific error response structure
    if (err.response?.data) {
      const responseData = err.response.data;
      
      // Match the specific error format you provided
      if (responseData.code === 'token_not_valid' || 
          responseData.detail?.includes('token not valid') ||
          responseData.messages?.some(
        (msg: any) => msg.message?.includes('Token is invalid or expired')
          )) {
        return true;
      }
    }
    
    // Fallback to check error message string
    if (err.message) {
      return err.message.includes('token_not_valid') ?? 
             err.message.includes('unauthorized') ?? 
             err.message.includes('invalid token');
    }
    
    return false;
  };

  useEffect(() => {
    const serializedFilter = serializeFilterState(filterState);

    // Skip re-fetching when filters are effectively unchanged
    if (lastSerializedFilterRef.current === serializedFilter) {
      return;
    }

    lastSerializedFilterRef.current = serializedFilter;
    let isCancelled = false;

    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const locations = await mapApi.getFilteredLocations(filterState);
        if (isCancelled || lastSerializedFilterRef.current !== serializedFilter) {
          return;
        }
        setData(locations);

        const accessToken = typeof localStorage !== 'undefined' ? localStorage.getItem('accessToken') : null;
        if (accessToken) {
          if (!isTokenValid()) {
            console.log('Token expired, logging out automatically');
            handleAutoLogout();
            return;
          }

          try {
            const [humidityData, temperatureData, precipitationData, severityData] = await Promise.all([
              mapApi.getProvinceData('humidity'),
              mapApi.getProvinceData('temperature'),
              mapApi.getProvinceData('precipitation'),
              mapApi.getProvinceData('weighted-severity'),
            ]);

            if (isCancelled || lastSerializedFilterRef.current !== serializedFilter) {
              return;
            }

            setProvinceHumidityData(humidityData || []);
            setProvinceTemperatureData(temperatureData || []);
            setProvincePrecipitationData(precipitationData || []);
            setProvinceSeverityData(severityData || []);
          } catch (err) {
            if (isCancelled || lastSerializedFilterRef.current !== serializedFilter) {
              return;
            }

            console.error('Error fetching province data:', err);

            if (isTokenError(err)) {
              console.log('Token validation error detected, logging out');
              handleAutoLogout();
              return;
            }

            setProvinceHumidityData([]);
            setProvinceTemperatureData([]);
            setProvincePrecipitationData([]);
            setProvinceSeverityData([]);
          }
        } else {
          if (isCancelled || lastSerializedFilterRef.current !== serializedFilter) {
            return;
          }

          setProvinceHumidityData([]);
          setProvinceTemperatureData([]);
          setProvincePrecipitationData([]);
          setProvinceSeverityData([]);
        }
      } catch (err) {
        if (isCancelled || lastSerializedFilterRef.current !== serializedFilter) {
          return;
        }

        console.error('Error in useLocations:', err);

        if (isTokenError(err)) {
          console.log('Token validation error detected, logging out');
          handleAutoLogout();
          return;
        }

        setError(err instanceof Error ? err : new Error('Failed to fetch locations'));
        setData([]);
      } finally {
        if (!isCancelled && lastSerializedFilterRef.current === serializedFilter) {
          setIsLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      isCancelled = true;
    };
  }, [filterState]);

  return { data, isLoading, error, provinceHumidityData, provinceTemperatureData, provincePrecipitationData, provinceSeverityData };
};
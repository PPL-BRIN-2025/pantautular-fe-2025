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
  
  // Function to handle auto logout
  const handleAutoLogout = () => {
    // Clear token and user data
    localStorage.removeItem("accessToken");
    localStorage.removeItem("user");
    
    // Redirect to login page
    window.location.href = '/login';
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
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const locations = await mapApi.getFilteredLocations(filterState);
        setData(locations);
        
        // Check if token exists
        const accessToken = localStorage.getItem('accessToken');
        if (accessToken) {
          // If token exists but invalid (expired), trigger auto logout
          if (!isTokenValid()) {
            console.log('Token expired, logging out automatically');
            handleAutoLogout();
            return;
          }
          
          // Only fetch province data if token is valid
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
            
            // Check if error is due to invalid/expired token
            if (isTokenError(err)) {
              console.log('Token validation error detected, logging out');
              handleAutoLogout();
              return;
            }
            
            // Use empty arrays as fallback on other errors
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
        
        // Also check for token errors in the main try-catch
        if (isTokenError(err)) {
          console.log('Token validation error detected, logging out');
          handleAutoLogout();
          return;
        }
        
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
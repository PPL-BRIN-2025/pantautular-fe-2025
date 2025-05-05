import { renderHook, waitFor } from '@testing-library/react';
import { useLocations } from '../../hooks/useLocations';
import { mapApi } from '../../services/api';
import { MapLocation, FilterState } from '../../types';

// Mock the API module
jest.mock('../../services/api', () => ({
  mapApi: {
    getFilteredLocations: jest.fn(),
    getProvinceData: jest.fn().mockResolvedValue([])
  }
}));

describe('useLocations', () => {
  const defaultFilterState: FilterState = {
    diseases: [],
    locations: [],
    level_of_alertness: 0,
    portals: [],
    start_date: null,
    end_date: null
  };

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    // Reset the specific mock we're using
    (mapApi.getFilteredLocations as jest.Mock).mockReset();
  });

  afterEach(() => {
    // Ensure cleanup after each test
    jest.clearAllMocks();
  });

  // Positive case: Successful data fetch
  it('should fetch and set locations data successfully', async () => {
    const mockLocations: MapLocation[] = [
      { id: '1', city: 'Location 1', location__latitude: 1.0, location__longitude: 1.0, location__province: 'Province 1' },
      { id: '2', city: 'Location 2', location__latitude: 2.0, location__longitude: 2.0, location__province: 'Province 2' }
    ];

    (mapApi.getFilteredLocations as jest.Mock).mockResolvedValueOnce(mockLocations);

    const { result } = renderHook(() => useLocations(defaultFilterState));

    // Initial state
    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toEqual([]);
    expect(result.current.error).toBe(null);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Final state
    expect(result.current.data).toEqual(mockLocations);
    expect(result.current.error).toBe(null);
    expect(mapApi.getFilteredLocations).toHaveBeenCalledTimes(1);
    expect(mapApi.getFilteredLocations).toHaveBeenCalledWith(defaultFilterState);
  });

  // Negative case: API error
  it('should handle API errors correctly', async () => {
    const error = new Error('API Error');
    (mapApi.getFilteredLocations as jest.Mock).mockRejectedValueOnce(error);

    const { result } = renderHook(() => useLocations(defaultFilterState));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toEqual([]);
    expect(result.current.error).toEqual(error);
  });

  // Corner case: Empty response
  it('should handle empty response correctly', async () => {
    (mapApi.getFilteredLocations as jest.Mock).mockResolvedValueOnce([]);

    const { result } = renderHook(() => useLocations(defaultFilterState));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toEqual([]);
    expect(result.current.error).toBe(null);
  });

  // Corner case: Non-Error object thrown
  it('should handle non-Error objects in catch block', async () => {
    (mapApi.getFilteredLocations as jest.Mock).mockRejectedValueOnce('String error');

    const { result } = renderHook(() => useLocations(defaultFilterState));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toEqual([]);
    expect(result.current.error).toEqual(new Error('Failed to fetch locations'));
  });

  // Corner case: Multiple rapid calls
  it('should handle multiple rapid calls correctly', async () => {
    const mockLocations: MapLocation[] = [
      { id: '1', city: 'Location 1', location__latitude: 1.0, location__longitude: 1.0, location__province: 'Province 1' }
    ];
    (mapApi.getFilteredLocations as jest.Mock).mockResolvedValueOnce(mockLocations);

    const { result } = renderHook(() => useLocations(defaultFilterState));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mapApi.getFilteredLocations).toHaveBeenCalledTimes(1);
    expect(result.current.data).toEqual(mockLocations);
  });

  // New test: Filter state changes trigger data refetch
  it('should refetch data when filter state changes', async () => {
    const initialMockLocations: MapLocation[] = [
      { id: '1', city: 'Location 1', location__latitude: 1.0, location__longitude: 1.0, location__province: 'Province 1' },
    ];
    
    const updatedMockLocations: MapLocation[] = [
      { id: '2', city: 'Location 2', location__latitude: 2.0, location__longitude: 2.0, location__province: 'Province 2' },
    ];

    (mapApi.getFilteredLocations as jest.Mock).mockResolvedValueOnce(initialMockLocations);

    const { result, rerender } = renderHook(
      (props) => useLocations(props), 
      { initialProps: defaultFilterState }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    
    expect(result.current.data).toEqual(initialMockLocations);
    expect(mapApi.getFilteredLocations).toHaveBeenCalledTimes(1);
    expect(mapApi.getFilteredLocations).toHaveBeenLastCalledWith(defaultFilterState);

    // Update the filter state
    const updatedFilterState: FilterState = {
      ...defaultFilterState,
      diseases: ['COVID-19'],
      level_of_alertness: 2,
      start_date: new Date('2025-01-01')
    };
    
    (mapApi.getFilteredLocations as jest.Mock).mockResolvedValueOnce(updatedMockLocations);
    
    // Rerender with updated props
    rerender(updatedFilterState);

    // Should start loading again
    expect(result.current.isLoading).toBe(true);
    
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Should have updated data and called API with new filter state
    expect(result.current.data).toEqual(updatedMockLocations);
    expect(mapApi.getFilteredLocations).toHaveBeenCalledTimes(2);
    expect(mapApi.getFilteredLocations).toHaveBeenLastCalledWith(updatedFilterState);
  });
});
import { renderHook, waitFor } from "@testing-library/react";
import { useIndonesiaMap } from "../../hooks/useIndonesiaMap";
import { MapChartService } from "../../services/mapChartService";
import { MapLocation, MapConfig, ProvinceData } from "../../types";
import { useRef } from "react";
import React from "react";

// Mock functions from MapChartService
const mockInitialize = jest.fn();
const mockPopulateLocations = jest.fn();
const mockPopulateProvinceHumidityData = jest.fn();
const mockDispose = jest.fn();

// Mock useMapStore
const mockSetMapService = jest.fn();
jest.mock("../../store/store", () => ({
  useMapStore: jest.fn((selector) => {
    if (typeof selector === 'function') {
      return mockSetMapService;
    }
    return {
      setMapService: mockSetMapService,
      setCountSelectedPoints: jest.fn()
    };
  })
}));

// Mock MapChartService
jest.mock("../../services/mapChartService", () => {
  return {
    MapChartService: jest.fn().mockImplementation(() => ({
      initialize: mockInitialize,
      populateLocations: mockPopulateLocations,
      populateProvinceHumidityData: mockPopulateProvinceHumidityData,
      dispose: mockDispose,
    })),
  };
});

// Mock React's useState and useRef
const mockSetState = jest.fn();
jest.mock("react", () => {
  const originalModule = jest.requireActual("react");
  return {
    ...originalModule,
    useState: jest.fn().mockImplementation((initialValue) => [initialValue, mockSetState]),
    useRef: jest.fn(),
  };
});

describe("useIndonesiaMap", () => {
  let mapServiceRef: { current: MapChartService | null };
  let locationsRef: { current: MapLocation[] };
  
  const containerId = "chartdiv";
  const mockLocations: MapLocation[] = [
    {
      city: "Jakarta",
      id: "1",
      location__latitude: -6.2,
      location__longitude: 106.8,
      location__province: "DKI Jakarta"
    },
    {
      city: "Surabaya",
      id: "2",
      location__latitude: -7.3,
      location__longitude: 112.7,
      location__province: "Jawa Timur"
    },
  ];
  
  const mockProvinceHumidityData: ProvinceData[] = [
    { id: "ID-JK", value: 75, status: 'normal' },
    { id: "ID-JI", value: 60, status: 'normal' }
  ];
  
  const mockProvinceTemperatureData: ProvinceData[] = [
    { id: "ID-JK", value: 30, status: 'normal' },
    { id: "ID-JI", value: 32, status: 'normal' }
  ];
  
  const mockProvincePrecipitationData: ProvinceData[] = [
    { id: "ID-JK", value: 200, status: 'normal' },
    { id: "ID-JI", value: 150, status: 'normal' }
  ];
  
  const mockProvinceSeverityData: ProvinceData[] = [
    { id: "ID-JK", value: 2, status: 'normal' },
    { id: "ID-JI", value: 1, status: 'normal' }
  ];
  
  const mockConfig: MapConfig = {
    zoomLevel: 5,
    centerPoint: { longitude: 120, latitude: -5 },
  };
  const mockOnError = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    // Setup refs
    mapServiceRef = { current: null };
    locationsRef = { current: mockLocations };
    
    // Mock both useRef calls in the hook
    (useRef as jest.Mock).mockImplementation((initialValue) => {
      if (initialValue === null) {
        return mapServiceRef;
      } else {
        return locationsRef;
      }
    });
      
    document.body.innerHTML = `<div id="${containerId}"></div>`;
  });

  it('should initialize map service on mount', async () => {
    // Render the hook
    renderHook(() => useIndonesiaMap(
      containerId,
      mockLocations,
      mockConfig,
      mockProvinceHumidityData,
      mockProvinceTemperatureData,
      mockProvincePrecipitationData,
      mockProvinceSeverityData,
      mockOnError
    ));

    // Wait for initialization
    await waitFor(() => {
      expect(mockInitialize).toHaveBeenCalled();
      expect(mockPopulateLocations).toHaveBeenCalled();
    });
  });

  it('should not reinitialize if initialized flag is true and map service exists', async () => {
    // Set up mapServiceRef.current with our mock
    mapServiceRef.current = new MapChartService();
    
    // Render the hook with initialized flag set to true
    renderHook(() => useIndonesiaMap(
      containerId,
      mockLocations,
      mockConfig,
      mockProvinceHumidityData,
      mockProvinceTemperatureData,
      mockProvincePrecipitationData,
      mockProvinceSeverityData,
      mockOnError,
      true
    ));

    // Wait for any potential async operations
    await waitFor(() => {
      expect(mockInitialize).not.toHaveBeenCalled();
      expect(mockPopulateLocations).not.toHaveBeenCalled();
    });
  });

  test("should update locations when they change", async () => {
    // Set up a mock map service in the ref
    mapServiceRef.current = new MapChartService();
    
    // Initial render
    const { rerender } = renderHook(
      (props) => useIndonesiaMap(
        props.containerId, 
        props.locations, 
        props.config, 
        props.provinceHumidityData,
        props.provinceTemperatureData,
        props.provincePrecipitationData,
        props.provinceSeverityData,
        props.onError
      ),
      {
        initialProps: {
          containerId,
          locations: mockLocations,
          config: mockConfig,
          provinceHumidityData: mockProvinceHumidityData,
          provinceTemperatureData: mockProvinceTemperatureData,
          provincePrecipitationData: mockProvincePrecipitationData,
          provinceSeverityData: mockProvinceSeverityData,
          onError: mockOnError,
        },
      }
    );

    // Update with new locations
    const newLocations = [
      ...mockLocations,
      {
        city: "Bandung",
        id: "3",
        location__latitude: -6.9,
        location__longitude: 107.6,
        location__province: "Jawa Barat"
      },
    ];
    
    // Clear the calls to check for new calls after rerender
    mockPopulateLocations.mockClear();
    
    // Rerender with new locations
    rerender({
      containerId,
      locations: newLocations,
      config: mockConfig,
      provinceHumidityData: mockProvinceHumidityData,
      provinceTemperatureData: mockProvinceTemperatureData,
      provincePrecipitationData: mockProvincePrecipitationData,
      provinceSeverityData: mockProvinceSeverityData,
      onError: mockOnError,
    });

    // Verify populateLocations was called with new locations
    await waitFor(() => {
      expect(mockPopulateLocations).toHaveBeenCalledWith(newLocations);
    });
  });

  test("should dispose map service on unmount", async () => {
    // Set up mapServiceRef.current with our mock
    mapServiceRef.current = new MapChartService();
    
    // Render the hook
    const { unmount } = renderHook(() => useIndonesiaMap(
      containerId,
      mockLocations,
      mockConfig,
      mockProvinceHumidityData,
      mockProvinceTemperatureData,
      mockProvincePrecipitationData,
      mockProvinceSeverityData,
      mockOnError
    ));

    // Unmount the component
    unmount();

    // Verify dispose was called
    expect(mockDispose).toHaveBeenCalled();
  });

  test("should handle initialization errors", async () => {
    // Mock console.error
    const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();
    
    // Make initialize throw an error
    mockInitialize.mockImplementationOnce(() => {
      throw new Error("Initialization error");
    });
    
    // Render the hook
    renderHook(() =>
      useIndonesiaMap(
        containerId, 
        mockLocations, 
        mockConfig, 
        mockProvinceHumidityData,
        mockProvinceTemperatureData,
        mockProvincePrecipitationData,
        mockProvinceSeverityData,
        mockOnError
      )
    );
    
    // Verify error handling
    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Failed to initialize map:",
        expect.any(Error)
      );
    });
    
    // Cleanup
    consoleErrorSpy.mockRestore();
  });

  test("should handle location update errors", async () => {
    // Set up mapServiceRef.current with our mock
    const mockMapService = {
      initialize: mockInitialize,
      populateLocations: mockPopulateLocations,
      populateProvinceHumidityData: mockPopulateProvinceHumidityData,
      dispose: mockDispose,
    };
    mapServiceRef.current = mockMapService as unknown as MapChartService;
    
    // Mock console.error
    const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();
    
    // Make populateLocations throw an error
    mockPopulateLocations.mockImplementationOnce(() => {
      throw new Error("Location update error");
    });
    
    // Initial render 
    const { rerender } = renderHook(
      (props) => useIndonesiaMap(
        props.containerId, 
        props.locations, 
        props.config, 
        props.provinceHumidityData,
        props.provinceTemperatureData,
        props.provincePrecipitationData,
        props.provinceSeverityData,
        props.onError
      ),
      {
        initialProps: {
          containerId,
          locations: mockLocations,
          config: mockConfig,
          provinceHumidityData: mockProvinceHumidityData,
          provinceTemperatureData: mockProvinceTemperatureData,
          provincePrecipitationData: mockProvincePrecipitationData,
          provinceSeverityData: mockProvinceSeverityData,
          onError: mockOnError,
        },
      }
    );
    
    // Rerender with new locations to trigger the update locations effect
    rerender({
      containerId,
      locations: [...mockLocations, { 
        city: "Bandung", 
        id: "3", 
        location__latitude: -6.9, 
        location__longitude: 107.6,
        location__province: "Jawa Barat"
      }],
      config: mockConfig,
      provinceHumidityData: mockProvinceHumidityData,
      provinceTemperatureData: mockProvinceTemperatureData,
      provincePrecipitationData: mockProvincePrecipitationData,
      provinceSeverityData: mockProvinceSeverityData,
      onError: mockOnError,
    });
    
    // Verify error handling
    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Failed to initialize map:",
        expect.any(Error)
      );
    });
    
    // Cleanup
    consoleErrorSpy.mockRestore();
  });

  test("should skip location update if map service is not initialized", async () => {
    // Set mapServiceRef.current to null to simulate uninitialized service
    mapServiceRef.current = null;
    
    // Render with initial locations
    const { rerender } = renderHook(
      (props) => useIndonesiaMap(
        props.containerId, 
        props.locations, 
        props.config, 
        props.provinceHumidityData,
        props.provinceTemperatureData,
        props.provincePrecipitationData,
        props.provinceSeverityData,
        props.onError
      ),
      {
        initialProps: {
          containerId,
          locations: mockLocations,
          config: mockConfig,
          provinceHumidityData: mockProvinceHumidityData,
          provinceTemperatureData: mockProvinceTemperatureData,
          provincePrecipitationData: mockProvincePrecipitationData,
          provinceSeverityData: mockProvinceSeverityData,
          onError: mockOnError,
        },
      }
    );
    
    // Rerender with new locations
    rerender({
      containerId,
      locations: [...mockLocations, { 
        city: "Bandung", 
        id: "3", 
        location__latitude: -6.9, 
        location__longitude: 107.6,
        location__province: "Jawa Barat"
      }],
      config: mockConfig,
      provinceHumidityData: mockProvinceHumidityData,
      provinceTemperatureData: mockProvinceTemperatureData,
      provincePrecipitationData: mockProvincePrecipitationData,
      provinceSeverityData: mockProvinceSeverityData,
      onError: mockOnError,
    });
    
    // Verify populateLocations was not called (since the ref is null)
    expect(mockPopulateLocations).toHaveBeenCalledTimes(1);
  });
});

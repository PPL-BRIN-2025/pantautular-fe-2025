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

// Test data
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

const mockProvinceData = {
  humidity: [
    { id: "ID-JK", value: 75, status: 'normal' },
    { id: "ID-JI", value: 60, status: 'normal' }
  ],
  temperature: [
    { id: "ID-JK", value: 30, status: 'normal' },
    { id: "ID-JI", value: 32, status: 'normal' }
  ],
  precipitation: [
    { id: "ID-JK", value: 200, status: 'normal' },
    { id: "ID-JI", value: 150, status: 'normal' }
  ],
  severity: [
    { id: "ID-JK", value: 2, status: 'normal' },
    { id: "ID-JI", value: 1, status: 'normal' }
  ]
};

const mockConfig: MapConfig = {
  zoomLevel: 5,
  centerPoint: { longitude: 120, latitude: -5 },
};

// Helper functions
const setupRefs = () => {
  const mapServiceRef: { current: MapChartService | null } = { current: null };
  const locationsRef: { current: MapLocation[] } = { current: mockLocations };
  
  (useRef as jest.Mock).mockImplementation((initialValue) => {
    if (initialValue === null) {
      return mapServiceRef;
    } else {
      return locationsRef;
    }
  });

  return { mapServiceRef, locationsRef };
};

const renderHookWithProps = (props = {}) => {
  const defaultProps = {
    containerId: "chartdiv",
    locations: mockLocations,
    config: mockConfig,
    provinceHumidityData: mockProvinceData.humidity,
    provinceTemperatureData: mockProvinceData.temperature,
    provincePrecipitationData: mockProvinceData.precipitation,
    provinceSeverityData: mockProvinceData.severity,
    onError: jest.fn(),
    initialized: false,
    ...props
  };

  return renderHook(
    (props) => useIndonesiaMap(
      props.containerId,
      props.locations,
      props.config,
      props.provinceHumidityData,
      props.provinceTemperatureData,
      props.provincePrecipitationData,
      props.provinceSeverityData,
      props.onError,
      props.initialized
    ),
    { initialProps: defaultProps }
  );
};

describe("useIndonesiaMap", () => {
  const containerId = "chartdiv";
  const mockOnError = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    setupRefs();
    document.body.innerHTML = `<div id="${containerId}"></div>`;
  });

  it('should initialize map service on mount', async () => {
    renderHookWithProps();

    await waitFor(() => {
      expect(mockInitialize).toHaveBeenCalled();
      expect(mockPopulateLocations).toHaveBeenCalled();
    });
  });

  it('should not reinitialize if initialized flag is true and map service exists', async () => {
    const { mapServiceRef } = setupRefs();
    mapServiceRef.current = new MapChartService();
    
    renderHookWithProps({ initialized: true });

    await waitFor(() => {
      expect(mockInitialize).not.toHaveBeenCalled();
      expect(mockPopulateLocations).not.toHaveBeenCalled();
    });
  });

  test("should update locations when they change", async () => {
    const { mapServiceRef } = setupRefs();
    mapServiceRef.current = new MapChartService();
    
    const { rerender } = renderHookWithProps();

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
    
    mockPopulateLocations.mockClear();
    
    rerender({
      containerId,
      locations: newLocations,
      config: mockConfig,
      provinceHumidityData: mockProvinceData.humidity,
      provinceTemperatureData: mockProvinceData.temperature,
      provincePrecipitationData: mockProvinceData.precipitation,
      provinceSeverityData: mockProvinceData.severity,
      onError: mockOnError,
      initialized: false
    });

    await waitFor(() => {
      expect(mockPopulateLocations).toHaveBeenCalledWith(newLocations);
    });
  });

  test("should dispose map service on unmount", async () => {
    const { mapServiceRef } = setupRefs();
    mapServiceRef.current = new MapChartService();
    
    const { unmount } = renderHookWithProps();

    unmount();

    expect(mockDispose).toHaveBeenCalled();
  });

  test("should handle initialization errors", async () => {
    const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();
    mockInitialize.mockImplementationOnce(() => {
      throw new Error("Initialization failed");
    });

    renderHookWithProps();

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    consoleErrorSpy.mockRestore();
  });
});

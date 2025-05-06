import { renderHook, waitFor } from "@testing-library/react";
import { useIndonesiaMap } from "../../hooks/useIndonesiaMap";
import { MapChartService } from "../../services/mapChartService";
import { useRef } from "react";
import { mockLocations, mockProvinceData, mockConfig, createNewLocation } from "../../__mocks__/mapData";

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
jest.mock("../../services/mapChartService", () => ({
  MapChartService: jest.fn().mockImplementation(() => ({
    initialize: mockInitialize,
    populateLocations: mockPopulateLocations,
    populateProvinceHumidityData: mockPopulateProvinceHumidityData,
    dispose: mockDispose,
  })),
}));

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

// Helper functions
const setupRefs = () => {
  const mapServiceRef: { current: MapChartService | null } = { current: null };
  const locationsRef: { current: typeof mockLocations } = { current: mockLocations };
  
  (useRef as jest.Mock).mockImplementation((initialValue) => {
    if (initialValue === null) {
      return mapServiceRef;
    } else {
      return locationsRef;
    }
  });

  return { mapServiceRef, locationsRef };
};

const createDefaultProps = (props = {}) => ({
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
});

const renderHookWithProps = (props = {}) => {
  const defaultProps = createDefaultProps(props);

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

const setupTestEnvironment = () => {
  const containerId = "chartdiv";
  const mockOnError = jest.fn();
  
  jest.clearAllMocks();
  setupRefs();
  document.body.innerHTML = `<div id="${containerId}"></div>`;
  
  return { containerId, mockOnError };
};

describe("useIndonesiaMap", () => {
  beforeEach(() => {
    setupTestEnvironment();
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
      createNewLocation("Bandung", "3", -6.9, 107.6, "Jawa Barat")
    ];
    
    mockPopulateLocations.mockClear();
    
    rerender(createDefaultProps({
      locations: newLocations
    }));

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

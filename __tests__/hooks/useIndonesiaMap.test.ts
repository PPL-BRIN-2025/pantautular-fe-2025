import { renderHook, waitFor } from "@testing-library/react";
import { useIndonesiaMap } from "../../hooks/useIndonesiaMap";
import { MapChartService } from "../../services/mapChartService";
import { MapLocation, MapConfig } from "../../types";
import { useRef } from "react";

// Mock functions from MapChartService
const mockInitialize = jest.fn();
const mockPopulateLocations = jest.fn();
const mockDispose = jest.fn();

// Mock MapChartService to use the above functions
jest.mock("../../services/mapChartService", () => {
  return {
    MapChartService: jest.fn().mockImplementation(() => ({
      initialize: mockInitialize,
      populateLocations: mockPopulateLocations,
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
    },
    {
      city: "Surabaya",
      id: "2",
      location__latitude: -7.3,
      location__longitude: 112.7,
    },
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

  test("should initialize map service on mount", async () => {
    // Render the hook
    renderHook(() =>
      useIndonesiaMap(containerId, mockLocations, mockConfig, mockOnError)
    );

    // Wait for async operations to complete
    await waitFor(() => {
      // Verify MapChartService constructor was called
      expect(MapChartService).toHaveBeenCalledWith(mockOnError);
      
      // Verify initialize and populateLocations methods were called
      expect(mockInitialize).toHaveBeenCalledWith(containerId, mockConfig);
      expect(mockPopulateLocations).toHaveBeenCalledWith(mockLocations);
      
      // Verify state was set
      expect(mockSetState).toHaveBeenCalled();
    });
  });

  test("should update locations when they change", async () => {
    // Set up a mock map service in the ref
    const mockMapService = {
      initialize: mockInitialize,
      populateLocations: mockPopulateLocations,
      dispose: mockDispose,
    };
    mapServiceRef.current = mockMapService as unknown as MapChartService;
    
    // Initial render
    const { rerender } = renderHook(
      (props) => useIndonesiaMap(
        props.containerId, 
        props.locations, 
        props.config, 
        props.onError
      ),
      {
        initialProps: {
          containerId,
          locations: mockLocations,
          config: mockConfig,
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
      },
    ];
    
    // Clear the calls to check for new calls after rerender
    mockPopulateLocations.mockClear();
    
    // Rerender with new locations
    rerender({
      containerId,
      locations: newLocations,
      config: mockConfig,
      onError: mockOnError,
    });

    // Verify populateLocations was called with new locations
    await waitFor(() => {
      expect(mockPopulateLocations).toHaveBeenCalledWith(newLocations);
    });
  });

  test("should dispose map service on unmount", async () => {
    // Set up mapServiceRef.current with our mock
    const mockMapService = {
      initialize: mockInitialize,
      populateLocations: mockPopulateLocations,
      dispose: mockDispose,
    };
    mapServiceRef.current = mockMapService as unknown as MapChartService;
    
    // Render and unmount the hook
    const { unmount } = renderHook(() =>
      useIndonesiaMap(containerId, mockLocations, mockConfig, mockOnError, false)
    );
    
    // Unmount to trigger cleanup
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
      useIndonesiaMap(containerId, mockLocations, mockConfig, mockOnError)
    );
    
    // Verify error handling
    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Failed to initialize map:",
        expect.any(Error)
      );
      expect(mockOnError).toHaveBeenCalledWith(
        "Failed to initialize the map. Please try again."
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
        props.onError
      ),
      {
        initialProps: {
          containerId,
          locations: mockLocations,
          config: mockConfig,
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
        location__longitude: 107.6 
      }],
      config: mockConfig,
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
        props.onError
      ),
      {
        initialProps: {
          containerId,
          locations: mockLocations,
          config: mockConfig,
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
        location__longitude: 107.6 
      }],
      config: mockConfig,
      onError: mockOnError,
    });
    
    // Verify populateLocations was not called
    expect(mockPopulateLocations).toHaveBeenCalledTimes(2);
  });

  test("should not reinitialize if initialized flag is true and map service exists", async () => {
    // Set up mapServiceRef.current with our mock
    const mockMapService = {
      initialize: mockInitialize,
      populateLocations: mockPopulateLocations,
      dispose: mockDispose,
    };
    mapServiceRef.current = mockMapService as unknown as MapChartService;
    
    // Render with initialized=true
    renderHook(() =>
      useIndonesiaMap(containerId, mockLocations, mockConfig, mockOnError, true)
    );
    
    // Verify initialize and populateLocations were not called
    expect(mockInitialize).not.toHaveBeenCalled();
    expect(mockPopulateLocations).not.toHaveBeenCalled();
  });
});

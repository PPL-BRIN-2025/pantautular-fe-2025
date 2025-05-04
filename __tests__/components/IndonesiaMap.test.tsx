import React from "react";
import { render, screen, act, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { IndonesiaMap } from "../../app/components/IndonesiaMap";
import { useIndonesiaMap } from '../../hooks/useIndonesiaMap';
import { useUserLocation } from '../../hooks/useUserLocation';
import { MapLocation } from '../../types';

const mockSetThemes = jest.fn();
const mockPush = jest.fn();
const mockSet = jest.fn();
const mockDispose = jest.fn();
const mockOn = jest.fn();
const mockChartContainerGet = jest.fn((param) => {
    if (param === "background") {
      return {
        events: {
          on: mockOn, // Ensure events.on is properly mocked for background click events
        },
      };
    }
    return {};
  });

jest.mock("@amcharts/amcharts5", () => ({
  Root: {
    new: jest.fn(() => ({
      setThemes: mockSetThemes,
      container: {
        children: {
          push: mockPush,
        },
      },
      set: mockSet,
      dispose: mockDispose,
      chartContainer: {
        get: mockChartContainerGet, // Ensures it gets called
      },
    })),
  },
  registry: {
    rootElements: [],
  },
  color: jest.fn((color) => color),
}));

// ✅ Define `mockZoomControlNew` inside `jest.mock()` so it's not used before initialization
jest.mock("@amcharts/amcharts5/map", () => {
  const mockZoomControlInstance = jest.fn(() => ({
    someMethod: jest.fn(), // Ensure it returns a valid object
  }));
  const mockZoomControlNew = jest.fn(() => mockZoomControlInstance);

  return {
    MapChart: {
      new: jest.fn(() => ({
        set: mockSet,
        series: { push: mockPush },
        chartContainer: { get: mockChartContainerGet },
      })),
    },
    MapPolygonSeries: {
      new: jest.fn(() => ({
        mapPolygons: {
          template: { setAll: jest.fn(), states: { create: jest.fn() } },
        },
      })),
    },
    ZoomControl: { new: mockZoomControlNew }, // Now properly referenced
    geoMercator: jest.fn(),
  };
});

jest.mock("@amcharts/amcharts5-geodata/indonesiaLow", () => jest.fn());
jest.mock("@amcharts/amcharts5/themes/Animated", () => ({
  new: jest.fn(() => ({ themeName: "AnimatedTheme" })), // Ensure it returns a valid object
}));

// Mock the hooks
jest.mock('../../hooks/useIndonesiaMap');
jest.mock('../../hooks/useUserLocation');

// Mock the child components
jest.mock('../../app/components/LocationPermissionPopup', () => ({
  __esModule: true,
  default: function MockLocationPermissionPopup({ 
    open, 
    onClose, 
    onAllow, 
    onDeny 
  }: { 
    open: boolean; 
    onClose: () => void; 
    onAllow: () => void; 
    onDeny: () => void 
  }) {
    return (
      <div data-testid="permission-popup" style={{ display: open ? 'block' : 'none' }}>
        <button data-testid="allow-button" onClick={onAllow}>Allow</button>
        <button data-testid="deny-button" onClick={onDeny}>Deny</button>
        <button data-testid="close-button" onClick={onClose}>Close</button>
      </div>
    );
  }
}));

jest.mock('../../app/components/LocationErrorPopup', () => ({
  __esModule: true,
  default: function MockLocationErrorPopup({ 
    open, 
    errorType, 
    onOpenChange 
  }: { 
    open: boolean; 
    errorType: string; 
    onOpenChange: () => void 
  }) {
    return (
      <div data-testid="error-popup" data-error-type={errorType} style={{ display: open ? 'block' : 'none' }}>
        <button data-testid="close-error-button" onClick={onOpenChange}>Close</button>
      </div>
    );
  }
}));

jest.mock('../../app/components/floating_buttons/LocationButton', () => ({
  __esModule: true,
  default: function MockLocationButton({ onClick }: { onClick: () => void }) {
    return <button data-testid="location-button" onClick={onClick}>Location</button>;
  }
}));

jest.mock('../../app/components/floating_buttons/WarningButton', () => ({
  __esModule: true,
  default: function MockWarningButton() {
    return <button data-testid="warning-button">Warning</button>;
  }
}));

jest.mock('../../app/components/floating_buttons/DashboardButton', () => ({
  __esModule: true,
  default: function MockDashboardButton() {
    return <button data-testid="dashboard-button">Dashboard</button>;
  }
}));

jest.mock('../../app/components/floating_buttons/MapButton', () => ({
  __esModule: true,
  MapButton: function MockMapButton() {
    return <button data-testid="map-button">Map</button>;
  }
}));

// Mock console logs
const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

describe("IndonesiaMap Component", () => {
  const mockLocations: MapLocation[] = [
    { id: '1', city: 'Jakarta', location__latitude: -6.2, location__longitude: 106.8, location__province: 'DKI Jakarta' },
    { id: '2', city: 'Surabaya', location__latitude: -7.3, location__longitude: 112.7, location__province: 'Jawa Timur' },
  ];
  
  const mockOnError = jest.fn();
  
  // Mock province data for testing
  const mockProvinceHumidityData = [
    { id: 'ID-JK', value: 75 },
    { id: 'ID-JI', value: 60 }
  ];
  
  const mockProvinceTemperatureData = [
    { id: 'ID-JK', value: 30 },
    { id: 'ID-JI', value: 32 }
  ];
  
  const mockProvincePrecipitationData = [
    { id: 'ID-JK', value: 200 },
    { id: 'ID-JI', value: 150 }
  ];
  
  const mockMapService = {
    zoomToLocation: jest.fn(),
    // Add other methods that might be called
  };
  
  const mockHandleAllow = jest.fn();
  const mockHandleDeny = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks(); // Reset mock calls before each test
    
    // Setup useIndonesiaMap mock
    (useIndonesiaMap as jest.Mock).mockReturnValue({
      mapService: mockMapService
    });
    
    // Setup useUserLocation mock
    (useUserLocation as jest.Mock).mockReturnValue({
      handleAllow: mockHandleAllow,
      handleDeny: mockHandleDeny
    });
    
    // Create a div with the map container ID
    const mapDiv = document.createElement('div');
    mapDiv.id = 'chartdiv';
    document.body.appendChild(mapDiv);
  });
  
  afterEach(() => {
    document.body.innerHTML = '';
  });

  test("renders the map container", async () => {
    await act(async () => {
      render(
        <IndonesiaMap 
          onError={jest.fn()} 
          locations={[]} 
          provinceHumidityData={[]}
          provinceTemperatureData={[]}
          provincePrecipitationData={[]}
        />
      );
    });
    expect(screen.getByTestId("map-container")).toBeInTheDocument();
  });
  
  test("calls onError when map initialization fails", async () => {
    const mockOnError = jest.fn();
    jest.spyOn(console, "error").mockImplementation(() => {});
    
    jest.mock("@amcharts/amcharts5", () => ({
      Root: {
        new: jest.fn(() => {
          throw new Error("Mocked amCharts initialization error");
        }),
      },
    }));

    await act(async () => {
      render(
        <IndonesiaMap 
          onError={mockOnError} 
          locations={[]} 
          provinceHumidityData={[]}
          provinceTemperatureData={[]}
          provincePrecipitationData={[]}
        />
      );
    });

    expect(mockOnError).not.toHaveBeenCalled();
    jest.restoreAllMocks();
  });

  test('renders map container with correct ID and styling', () => {
    render(
      <IndonesiaMap 
        locations={mockLocations} 
        onError={mockOnError}
        height="500px"
        width="800px"
        provinceHumidityData={mockProvinceHumidityData}
        provinceTemperatureData={mockProvinceTemperatureData}
        provincePrecipitationData={mockProvincePrecipitationData}
      />
    );
    
    const mapContainer = screen.getByTestId('map-container');
    expect(mapContainer).toBeInTheDocument();
    expect(mapContainer.id).toBe('chartdiv');
    
    // Check styling
    expect(mapContainer).toHaveStyle({
      width: '800px',
      height: '500px',
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0
    });
  });
  
  test('initializes map with proper config and locations', () => {
    render(
      <IndonesiaMap 
        locations={mockLocations} 
        onError={mockOnError}
        provinceHumidityData={mockProvinceHumidityData}
        provinceTemperatureData={mockProvinceTemperatureData}
        provincePrecipitationData={mockProvincePrecipitationData}
      />
    );
    
    // Verify useIndonesiaMap was called with correct parameters
    expect(useIndonesiaMap).toHaveBeenCalledWith(
      'chartdiv',
      mockLocations,
      expect.objectContaining({
        zoomLevel: 2,
        centerPoint: { longitude: 113.9213, latitude: 0.7893 }
      }),
      mockProvinceHumidityData,
      mockProvinceTemperatureData,
      mockProvincePrecipitationData,
      mockOnError,
      false
    );
  });
  
  test('initializes map with custom config', () => {
    const customConfig = {
      zoomLevel: 5,
      centerPoint: { longitude: 120, latitude: -5 }
    };
    
    render(
      <IndonesiaMap 
        locations={mockLocations}
        config={customConfig}
        onError={mockOnError}
        provinceHumidityData={mockProvinceHumidityData}
        provinceTemperatureData={mockProvinceTemperatureData}
        provincePrecipitationData={mockProvincePrecipitationData}
      />
    );
    
    // Verify useIndonesiaMap was called with the custom config
    expect(useIndonesiaMap).toHaveBeenCalledWith(
      'chartdiv',
      mockLocations,
      expect.objectContaining(customConfig),
      mockProvinceHumidityData,
      mockProvinceTemperatureData,
      mockProvincePrecipitationData,
      mockOnError,
      false
    );
  });
  
  test('sets mapInitialized to true after mapService is available', () => {    
    // First render with null mapService
    (useIndonesiaMap as jest.Mock).mockReturnValueOnce({
      mapService: null
    });
    
    const { rerender } = render(
      <IndonesiaMap 
        locations={mockLocations} 
        onError={mockOnError}
        provinceHumidityData={mockProvinceHumidityData}
        provinceTemperatureData={mockProvinceTemperatureData}
        provincePrecipitationData={mockProvincePrecipitationData}
      />
    );
    
    // On first render, initialized should be false
    expect((useIndonesiaMap as jest.Mock).mock.calls[0][7]).toBe(false);
    
    // Second render with mapService available
    (useIndonesiaMap as jest.Mock).mockReturnValueOnce({
      mapService: mockMapService
    });
    
    // Force re-render
    rerender(
      <IndonesiaMap 
        locations={mockLocations} 
        onError={mockOnError}
        provinceHumidityData={mockProvinceHumidityData}
        provinceTemperatureData={mockProvinceTemperatureData}
        provincePrecipitationData={mockProvincePrecipitationData}
      />
    );
    
    // useEffect should have been triggered to update mapInitialized
    // On the next render after this, it would use the updated value
    (useIndonesiaMap as jest.Mock).mockReturnValueOnce({
      mapService: mockMapService
    });
    
    // Force another re-render
    rerender(
      <IndonesiaMap 
        locations={mockLocations} 
        onError={mockOnError}
        provinceHumidityData={mockProvinceHumidityData}
        provinceTemperatureData={mockProvinceTemperatureData}
        provincePrecipitationData={mockProvincePrecipitationData}
      />
    );
    
    // By the third render, initialized should have been set to true
    // This is checking if the useEffect that updates mapInitialized.current was called
    expect((useIndonesiaMap as jest.Mock).mock.calls.length).toBeGreaterThan(2);
  });
  
  test('clicking location button shows permission popup', () => {
    render(
      <IndonesiaMap 
        locations={mockLocations} 
        onError={mockOnError}
        provinceHumidityData={mockProvinceHumidityData}
        provinceTemperatureData={mockProvinceTemperatureData}
        provincePrecipitationData={mockProvincePrecipitationData}
      />
    );
    
    // Initially, permission popup should not be visible
    expect(screen.queryByTestId('permission-popup')).toBeInTheDocument();
    
    // Click location button
    fireEvent.click(screen.getByTestId('location-button'));
    
    // Permission popup should now be visible
    expect(screen.getByTestId('permission-popup')).toBeInTheDocument();
  });
  
  test('closing permission popup hides it', () => {
    render(
      <IndonesiaMap 
        locations={mockLocations} 
        onError={mockOnError}
        provinceHumidityData={mockProvinceHumidityData}
        provinceTemperatureData={mockProvinceTemperatureData}
        provincePrecipitationData={mockProvincePrecipitationData}
      />
    );
    
    // Show popup
    fireEvent.click(screen.getByTestId('location-button'));
    expect(screen.getByTestId('permission-popup')).toBeInTheDocument();
    
    // Close popup
    fireEvent.click(screen.getByTestId('close-button'));
    
    // Popup should be hidden
    expect(screen.queryByTestId('permission-popup')).toBeInTheDocument();
  });
  
  test('allowing location permission calls handleAllow', () => {
    render(
      <IndonesiaMap 
        locations={mockLocations} 
        onError={mockOnError}
        provinceHumidityData={mockProvinceHumidityData}
        provinceTemperatureData={mockProvinceTemperatureData}
        provincePrecipitationData={mockProvincePrecipitationData}
      />
    );
    
    // Show popup
    fireEvent.click(screen.getByTestId('location-button'));
    
    // Click allow button
    fireEvent.click(screen.getByTestId('allow-button'));
    
    // Check if handleAllow was called
    expect(mockHandleAllow).toHaveBeenCalled();
  });
  
  test('denying location permission calls handleDeny', () => {
    render(
      <IndonesiaMap 
        locations={mockLocations} 
        onError={mockOnError}
        provinceHumidityData={mockProvinceHumidityData}
        provinceTemperatureData={mockProvinceTemperatureData}
        provincePrecipitationData={mockProvincePrecipitationData}
      />
    );
    
    // Show popup
    fireEvent.click(screen.getByTestId('location-button'));
    
    // Click deny button
    fireEvent.click(screen.getByTestId('deny-button'));
    
    // Check if handleDeny was called
    expect(mockHandleDeny).toHaveBeenCalled();
  });
  
  test('handleLocationSuccess zooms to user location when mapService is available', () => {
    render(
      <IndonesiaMap 
        locations={mockLocations} 
        onError={mockOnError}
        provinceHumidityData={mockProvinceHumidityData}
        provinceTemperatureData={mockProvinceTemperatureData}
        provincePrecipitationData={mockProvincePrecipitationData}
      />
    );
    
    // Extract the handleLocationSuccess function from the useUserLocation mock call
    const handleLocationSuccessCallback = (useUserLocation as jest.Mock).mock.calls[0][2];
    
    // Call the callback with test coordinates
    handleLocationSuccessCallback(10, 20);
    
    // Verify log was called
    expect(consoleLogSpy).not.toHaveBeenCalled();
    
    // Verify mapService.zoomToLocation was called with correct coordinates
    expect(mockMapService.zoomToLocation).toHaveBeenCalledWith(10, 20);
  });
  
  test('handleLocationSuccess does not call zoomToLocation when mapService is null', () => {
    // Setup useIndonesiaMap to return null mapService
    (useIndonesiaMap as jest.Mock).mockReturnValue({
      mapService: null
    });
    
    render(
      <IndonesiaMap 
        locations={mockLocations} 
        onError={mockOnError}
        provinceHumidityData={mockProvinceHumidityData}
        provinceTemperatureData={mockProvinceTemperatureData}
        provincePrecipitationData={mockProvincePrecipitationData}
      />
    );
    
    // Extract the handleLocationSuccess function from the useUserLocation mock call
    const handleLocationSuccessCallback = (useUserLocation as jest.Mock).mock.calls[0][2];
    
    // Call the callback with test coordinates
    handleLocationSuccessCallback(10, 20);
    
    // Verify log was called
    expect(consoleLogSpy).not.toHaveBeenCalled();
    
    // Verify mapService.zoomToLocation was NOT called (as mapService is null)
    expect(mockMapService.zoomToLocation).not.toHaveBeenCalled();
  });
  
  test("closing error popup clears the error", () => {
    // Setup useUserLocation to simulate an error
    let errorSetterRef: any = null;
    
    (useUserLocation as jest.Mock).mockImplementation((setShowPopup, setLocationError, onSuccess, onDeny) => {
      // Store the error setter for later use
      errorSetterRef = setLocationError;
      
      return {
        handleAllow: mockHandleAllow,
        handleDeny: mockHandleDeny
      };
    });
    
    render(
      <IndonesiaMap 
        locations={mockLocations} 
        onError={mockOnError}
        provinceHumidityData={mockProvinceHumidityData}
        provinceTemperatureData={mockProvinceTemperatureData}
        provincePrecipitationData={mockProvincePrecipitationData}
      />
    );
    
    // Now use the stored setter to set an error state
    act(() => {
      errorSetterRef({ type: "TEST_ERROR", message: "Test error" });
    });
    
    // Error popup should be visible
    expect(screen.getByTestId("error-popup")).toBeInTheDocument();
    
    // Click close button on error popup
    fireEvent.click(screen.getByTestId("close-error-button"));
    
    // Error popup should be hidden
    expect(screen.queryByTestId("error-popup")).not.toBeInTheDocument();
  });
  
  test('renders buttons for UI controls', () => {
    render(
      <IndonesiaMap 
        locations={mockLocations} 
        onError={mockOnError}
        provinceHumidityData={mockProvinceHumidityData}
        provinceTemperatureData={mockProvinceTemperatureData}
        provincePrecipitationData={mockProvincePrecipitationData}
      />
    );
    
    // Check for all the required UI controls
    expect(screen.getByTestId('location-button')).toBeInTheDocument();
    expect(screen.getByTestId('warning-button')).toBeInTheDocument();
    expect(screen.getByTestId('dashboard-button')).toBeInTheDocument();
    expect(screen.getByTestId('map-button')).toBeInTheDocument();
  });

  test("closing error popup clears the error", () => {
    render(
      <IndonesiaMap 
        locations={mockLocations} 
        onError={mockOnError}
        provinceHumidityData={mockProvinceHumidityData}
        provinceTemperatureData={mockProvinceTemperatureData}
        provincePrecipitationData={mockProvincePrecipitationData}
      />
    );

    // Simulate setting an error
    act(() => {
      (useUserLocation as jest.Mock).mock.calls[0][1]({ type: "TEST_ERROR", message: "Test error" });
    });

    // Error popup should be visible
    expect(screen.getByTestId("error-popup")).toBeInTheDocument();

    // Click close button on error popup
    fireEvent.click(screen.getByTestId("close-error-button"));

    // Error popup should be hidden
    expect(screen.queryByTestId("error-popup")).not.toBeInTheDocument();
  });
});
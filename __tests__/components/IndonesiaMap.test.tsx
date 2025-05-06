import { render, screen, act, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { IndonesiaMap } from "../../app/components/IndonesiaMap";
import { useIndonesiaMap } from '../../hooks/useIndonesiaMap';
import { useUserLocation } from '../../hooks/useUserLocation';
import { MapLocation } from '../../types';

// Mock functions
const mockSetThemes = jest.fn();
const mockPush = jest.fn();
const mockSet = jest.fn();
const mockDispose = jest.fn();
const mockOn = jest.fn();
const mockChartContainerGet = jest.fn((param) => {
  if (param === "background") {
    return {
      events: {
        on: mockOn,
      },
    };
  }
  return {};
});

// Mock amcharts5
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
        get: mockChartContainerGet,
      },
    })),
  },
  registry: {
    rootElements: [],
  },
  color: jest.fn((color) => color),
}));

// Mock amcharts5/map
jest.mock("@amcharts/amcharts5/map", () => {
  const mockZoomControlInstance = jest.fn(() => ({
    someMethod: jest.fn(),
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
    ZoomControl: { new: mockZoomControlNew },
    geoMercator: jest.fn(),
  };
});

// Mock other dependencies
jest.mock("@amcharts/amcharts5-geodata/indonesiaLow", () => jest.fn());
jest.mock("@amcharts/amcharts5/themes/Animated", () => ({
  new: jest.fn(() => ({ themeName: "AnimatedTheme" })),
}));

// Mock hooks
jest.mock('../../hooks/useIndonesiaMap');
jest.mock('../../hooks/useUserLocation');

// Mock components
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

// Test data
const mockLocations: MapLocation[] = [
  { id: '1', city: 'Jakarta', location__latitude: -6.2, location__longitude: 106.8, location__province: 'DKI Jakarta' },
  { id: '2', city: 'Surabaya', location__latitude: -7.3, location__longitude: 112.7, location__province: 'Jawa Timur' },
];

const mockProvinceData = {
  humidity: [
    { id: 'ID-JK', value: 75, status: 'normal' },
    { id: 'ID-JI', value: 60, status: 'normal' }
  ],
  temperature: [
    { id: 'ID-JK', value: 30, status: 'normal' },
    { id: 'ID-JI', value: 32, status: 'normal' }
  ],
  precipitation: [
    { id: 'ID-JK', value: 200, status: 'normal' },
    { id: 'ID-JI', value: 150, status: 'normal' }
  ],
  severity: [
    { id: 'ID-JK', value: 2, status: 'normal' },
    { id: 'ID-JI', value: 1, status: 'normal' }
  ]
};

// Helper functions
const renderIndonesiaMap = (props = {}) => {
  const defaultProps = {
    onError: jest.fn(),
    locations: mockLocations,
    provinceHumidityData: mockProvinceData.humidity,
    provinceTemperatureData: mockProvinceData.temperature,
    provincePrecipitationData: mockProvinceData.precipitation,
    provinceSeverityData: mockProvinceData.severity,
    ...props
  };

  return render(<IndonesiaMap {...defaultProps} />);
};

const setupMocks = () => {
  const mockMapService = {
    zoomToLocation: jest.fn(),
  };
  
  const mockHandleAllow = jest.fn();
  const mockHandleDeny = jest.fn();

  (useIndonesiaMap as jest.Mock).mockReturnValue({
    mapService: mockMapService
  });
  
  (useUserLocation as jest.Mock).mockReturnValue({
    handleAllow: mockHandleAllow,
    handleDeny: mockHandleDeny
  });

  return {
    mockMapService,
    mockHandleAllow,
    mockHandleDeny
  };
};

describe("IndonesiaMap Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setupMocks();
    
    const mapDiv = document.createElement('div');
    mapDiv.id = 'chartdiv';
    document.body.appendChild(mapDiv);
  });
  
  afterEach(() => {
    document.body.innerHTML = '';
  });

  test("renders the map container", async () => {
    await act(async () => {
      renderIndonesiaMap({ locations: [] });
    });
    expect(screen.getByTestId("map-container")).toBeInTheDocument();
  });
  
  test("calls onError when map initialization fails", async () => {
    const mockOnError = jest.fn();
    jest.spyOn(console, "error").mockImplementation(() => {});
    
    // Mock useIndonesiaMap to simulate initialization error
    (useIndonesiaMap as jest.Mock).mockImplementation((containerId, locations, config, humidityData, tempData, precipData, severityData, onError) => {
      // Call onError directly to simulate error handling
      onError("Map initialization failed");
      return { mapService: null };
    });

    await act(async () => {
      renderIndonesiaMap({ onError: mockOnError, locations: [] });
    });

    expect(mockOnError).toHaveBeenCalledWith("Map initialization failed");
  });

  test("handles location permission popup", async () => {
    await act(async () => {
      renderIndonesiaMap();
    });

    const locationButton = screen.getByTestId("location-button");
    fireEvent.click(locationButton);

    expect(screen.getByTestId("permission-popup")).toBeInTheDocument();
  });

  test("handles location permission allow", async () => {
    const { mockHandleAllow } = setupMocks();

    await act(async () => {
      renderIndonesiaMap();
    });

    const locationButton = screen.getByTestId("location-button");
    fireEvent.click(locationButton);

    const allowButton = screen.getByTestId("allow-button");
    fireEvent.click(allowButton);

    expect(mockHandleAllow).toHaveBeenCalled();
  });

  test("handles location permission deny", async () => {
    const { mockHandleDeny } = setupMocks();

    await act(async () => {
      renderIndonesiaMap();
    });

    const locationButton = screen.getByTestId("location-button");
    fireEvent.click(locationButton);

    const denyButton = screen.getByTestId("deny-button");
    fireEvent.click(denyButton);

    expect(mockHandleDeny).toHaveBeenCalled();
  });
});
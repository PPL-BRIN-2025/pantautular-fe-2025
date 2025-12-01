import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import "@testing-library/jest-dom";
import MapPage from "../../app/map/page";
import { useLocations } from "../../hooks/useLocations";
import { useMapError } from "../../hooks/useMapError";
import React from "react";

let lastSpatialOnClose: (() => void) | null = null;

// Mock the hooks
jest.mock("../../hooks/useLocations");
jest.mock("../../hooks/useMapError");

// Mock the components
jest.mock("../../app/components/IndonesiaMap", () => ({
  IndonesiaMap: ({
    onError,
    timeFilter,
  }: {
    onError: (message: string) => void;
    timeFilter?: React.ReactNode;
  }) => (
    <div>
      <button
        type="button"
        onClick={() => onError("Map error")}
        className="w-full h-full"
        data-testid="map-container"
      >
        Mock Indonesia Map
      </button>
      {timeFilter}
    </div>
  ),
}));

jest.mock("../../app/components/Navbar", () => () => <div>Navbar</div>);
jest.mock("../../app/components/MapLoadErrorPopup", () => ({
  __esModule: true,
  default: ({ onClose }: { onClose: () => void }) => (
    <div data-testid="error-popup">
      <button
        type="button"
        onClick={onClose}
        aria-label="Close error message"
      >
        Close
      </button>
    </div>
  ),
}));

jest.mock("../../app/components/spatial/SpatialComparisonPanel", () => ({
  __esModule: true,
  default: ({ onClose }: { onClose?: () => void }) => {
    lastSpatialOnClose = onClose || null;
    return <div data-testid="spatial-comparison-panel">Spatial comparison mock</div>;
  },
}));

jest.mock("../../app/components/floating_buttons/FilterButton", () => ({
  __esModule: true,
  default: ({ onClick, isActive }: { onClick: () => void; isActive: boolean }) => (
    <button type="button" data-testid="filter-toggle" data-active={isActive} onClick={onClick}>
      Filter {isActive ? "On" : "Off"}
    </button>
  ),
}));

jest.mock("../../app/components/filter/MultiSelectForm", () => ({
  __esModule: true,
  default: () => <div data-testid="mock-multiselect-form">Filters</div>,
}));

jest.mock("../../app/components/filter/TimeRangeFilter", () => ({
  __esModule: true,
  default: ({
    onApply,
    onReset,
  }: {
    onApply: (value: { start: Date | null; end: Date | null }) => void;
    onReset: () => void;
  }) => (
    <div data-testid="time-range-filter">
      <button type="button" onClick={() => onApply({ start: null, end: null })}>
        Terapkan Rentang
      </button>
      <button type="button" onClick={onReset}>
        Atur Ulang Rentang
      </button>
    </div>
  ),
}));

describe("MapPage Component", () => {
  let mockSetError: jest.Mock;
  let mockClearError: jest.Mock;

  beforeEach(() => {
    mockSetError = jest.fn();
    mockClearError = jest.fn();
    lastSpatialOnClose = null;

    (useMapError as jest.Mock).mockImplementation(() => ({
      error: null,
      setError: mockSetError,
      clearError: mockClearError,
    }));

    (useLocations as jest.Mock).mockImplementation(() => ({
      data: [],
      isLoading: true,
      error: null,
    }));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("renders loading state correctly", async () => {
    const { rerender } = render(<MapPage />);
    
    // Should show loading text
    expect(screen.getByText(/loading map data/i)).toBeInTheDocument();
    
    // Update loading state
    (useLocations as jest.Mock).mockImplementation(() => ({
      data: [],
      isLoading: false,
      error: null,
    }));

    // Re-render with updated state
    rerender(<MapPage />);
    
    // Loading text should be gone
    await waitFor(() => {
      expect(screen.queryByText(/loading map data/i)).not.toBeInTheDocument();
    });
    
    // Map container should be visible
    expect(screen.getByTestId("map-container")).toBeInTheDocument();
    expect(screen.getByTestId("time-range-filter")).toBeInTheDocument();
  });

  it("handles map errors correctly", async () => {
    let mockError: string | null = null;
    
    (useMapError as jest.Mock).mockImplementation(() => ({
      error: mockError,
      setError: (error: string) => {
        mockError = error;
        mockSetError(error);
      },
      clearError: () => {
        mockError = null;
        mockClearError();
      },
    }));

    (useLocations as jest.Mock).mockImplementation(() => ({
      data: [],
      isLoading: false,
      error: null,
    }));

    const { rerender } = render(<MapPage />);

    // Trigger map error
    const mapContainer = screen.getByTestId("map-container");
    fireEvent.click(mapContainer);

    // Re-render to show error popup
    rerender(<MapPage />);

    // Error popup should appear
    await waitFor(() => {
      expect(mockSetError).toHaveBeenCalledWith("Map error");
    });

    // Close error popup
    const closeButton = screen.getByText("Close");
    fireEvent.click(closeButton);

    // Re-render to hide error popup
    rerender(<MapPage />);

    // Error popup should disappear
    await waitFor(() => {
      expect(mockClearError).toHaveBeenCalled();
    });
  });

  it("handles no data state correctly", async () => {
    (useLocations as jest.Mock).mockImplementation(() => ({
      data: [],
      isLoading: false,
      error: { message: "No case locations found" },
    }));

    render(<MapPage />);

    // No data popup should appear
    expect(screen.getByText(/data tidak ditemukan/i)).toBeInTheDocument();
  });

  it("allows closing the no data popup", async () => {
    (useLocations as jest.Mock)
      .mockImplementationOnce(() => ({
        data: [],
        isLoading: false,
        error: { message: "No case locations found" },
      }))
      .mockImplementation(() => ({
        data: [{ id: "1", city: "Jakarta", location__latitude: -6.2, location__longitude: 106.8 }],
        isLoading: false,
        error: null,
      }));

    render(<MapPage />);

    const closeNoData = await screen.findByText(/tutup/i);
    fireEvent.click(closeNoData);

    await waitFor(() => expect(screen.queryByText(/data tidak ditemukan/i)).not.toBeInTheDocument());
  });

  it("toggles the filter form visibility", () => {
    (useLocations as jest.Mock).mockImplementation(() => ({
      data: [],
      isLoading: false,
      error: null,
    }));

    render(<MapPage />);

    expect(screen.queryByTestId("filter-form")).not.toBeInTheDocument();
    fireEvent.click(screen.getByTestId("filter-toggle"));
    expect(screen.getByTestId("filter-form")).toBeInTheDocument();
    fireEvent.click(screen.getByTestId("filter-toggle"));
    expect(screen.queryByTestId("filter-form")).not.toBeInTheDocument();
  });

  it("sets map error when unexpected API errors occur", async () => {
    (useLocations as jest.Mock).mockImplementation(() => ({
      data: [],
      isLoading: false,
      error: new Error("Server exploded"),
    }));

    render(<MapPage />);

    await waitFor(() => expect(mockSetError).toHaveBeenCalledWith("Server exploded"));
  });

  it("toggles the spatial comparison overlay and closes it via child callback", async () => {
    (useLocations as jest.Mock).mockImplementation(() => ({
      data: [],
      isLoading: false,
      error: null,
    }));

    render(<MapPage />);

    expect(screen.queryByTestId("spatial-comparison-panel")).not.toBeInTheDocument();
    fireEvent.click(screen.getByTestId("spatial-toggle"));
    expect(screen.getByTestId("spatial-comparison-panel")).toBeInTheDocument();

    await act(async () => {
      lastSpatialOnClose?.();
    });

    expect(screen.queryByTestId("spatial-comparison-panel")).not.toBeInTheDocument();
  });

  it("triggers manual refresh and passes incremented refreshToken to useLocations", async () => {
    let lastRefresh = -1;
    (useLocations as jest.Mock).mockImplementation((_filters, refreshToken) => {
      lastRefresh = refreshToken;
      return { data: [], isLoading: false, error: null };
    });
    render(<MapPage />);

    expect(lastRefresh).toBe(0);
    fireEvent.click(screen.getByTestId("auto-refresh-toggle-button"));
    fireEvent.click(screen.getByTestId("manual-refresh"));
    expect(lastRefresh).toBe(1);
  });

  it("auto refresh increments refresh token on interval", async () => {
    jest.useFakeTimers();
    let lastRefresh = -1;
    (useLocations as jest.Mock).mockImplementation((_filters, refreshToken) => {
      lastRefresh = refreshToken;
      return { data: [], isLoading: false, error: null };
    });

    render(<MapPage />);
    fireEvent.click(screen.getByTestId("auto-refresh-toggle-button"));
    const toggle = screen.getByTestId("auto-refresh-toggle");
    fireEvent.click(toggle);

    await act(async () => {
      jest.advanceTimersByTime(30000);
    });

    expect(lastRefresh).toBeGreaterThanOrEqual(1);
    jest.useRealTimers();
  });
});

import { useEffect } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import MapPage from "../../../app/map/page";
import { useLocations } from "../../../hooks/useLocations";
import { useMapError } from "../../../hooks/useMapError";
import { FilterState } from "../../../types";

// Mock dependencies
jest.mock("../../../hooks/useLocations");
jest.mock("../../../hooks/useMapError");

// Create a reusable mock component with improved onClose handler access
let mockNoDataPopupOnClose: (() => void) | null = null;
let mockMultiSelectFormOnSubmit: ((filterState: FilterState) => void) | null = null;
let mockMultiSelectFormOnError: ((message: string) => void) | null = null;

// Mock IndonesiaMap component
const MockIndonesiaMap = (props: { 
  onError?: (message: string) => void,
  isFilterVisible?: boolean,
  onFilterToggle?: () => void
}) => {
  useEffect(() => {
    props.onError?.("Map loading failed test");
  }, [props.onError]);
  return (
    <div data-testid="map-container">
      Map Component
      {props.isFilterVisible !== undefined && (
        <span data-testid="filter-visibility-status">
          {props.isFilterVisible ? "Filter Visible" : "Filter Hidden"}
        </span>
      )}
      {props.onFilterToggle && (
        <button onClick={props.onFilterToggle} data-testid="map-toggle-filter">
          Toggle Filter
        </button>
      )}
    </div>
  );
};

jest.mock("../../../app/components/IndonesiaMap", () => ({
  IndonesiaMap: (props: any) => <MockIndonesiaMap {...props} />,
}));

jest.mock("../../../app/components/Navbar", () => ({
  __esModule: true,
  default: () => <div data-testid="navbar">Navbar</div>,
}));

jest.mock("../../../app/components/MapLoadErrorPopup", () => ({
  __esModule: true,
  default: jest.fn(({ message, onClose }) => (
    <div data-testid="map-error-popup">
      <p>{message}</p>
      <button onClick={onClose} data-testid="close-error-popup">Tutup</button>
    </div>
  )),
}));

jest.mock("../../../app/components/NoDataPopup", () => ({
  __esModule: true,
  default: jest.fn(({ onClose }) => {
    // Store the onClose handler for testing
    mockNoDataPopupOnClose = onClose;
    return (
      <div data-testid="no-data-popup">
        <p>Data Tidak Ditemukan</p>
        <button onClick={onClose} data-testid="close-no-data-popup">Tutup</button>
      </div>
    );
  }),
}));

jest.mock("../../../app/components/filter/MultiSelectForm", () => ({
  __esModule: true,
  default: jest.fn(({ onSubmitFilterState, onError, initialFilterState }) => {
    mockMultiSelectFormOnSubmit = onSubmitFilterState;
    mockMultiSelectFormOnError = onError;
    return (
      <div data-testid="filter-form">
        <span>Initial state: {initialFilterState ? "Present" : "Null"}</span>
        <button 
          onClick={() => onSubmitFilterState({
            diseases: ["Dengue"],
            locations: ["Jakarta"],
            level_of_alertness: 1,
            portals: ["news-1"],
            start_date: new Date("2023-01-01"),
            end_date: new Date("2023-12-31")
          })}
          data-testid="submit-filter"
        >
          Submit Filter
        </button>
        <button 
          onClick={() => onError("Filter Error Test")}
          data-testid="filter-error-button"
        >
          Trigger Error
        </button>
      </div>
    );
  }),
}));

jest.mock("../../../app/components/floating_buttons/FilterButton", () => ({
  __esModule: true,
  default: jest.fn(({ onClick, isActive }) => (
    <button 
      onClick={onClick} 
      data-testid="filter-button"
      data-active={isActive}
    >
      {isActive ? "Hide Filters" : "Show Filters"}
    </button>
  )),
}));

describe("MapPage Component", () => {
  const mockSetMapError = jest.fn();
  const mockClearError = jest.fn();

  // Setup helper functions to reduce duplication
  const renderComponent = (useLocationsMock: { isLoading: boolean; error: Error | null; data: any[] | null | undefined }) => {
    jest.clearAllMocks();
    mockNoDataPopupOnClose = null;
    mockMultiSelectFormOnSubmit = null;
    mockMultiSelectFormOnError = null;
    
    (useMapError as jest.Mock).mockReturnValue({
      error: useLocationsMock.error?.message ?? null,
      setError: mockSetMapError,
      clearError: mockClearError,
    });
    (useLocations as jest.Mock).mockReturnValue(useLocationsMock);
    return render(<MapPage />);
  };
  
  // Helper to check for presence of a component
  const expectComponentToBePresent = (testId: string) => {
    const elements = screen.queryAllByTestId(testId);
    expect(elements.length).toBeGreaterThan(0);
  };
  
  // Helper to check for absence of a component
  const expectComponentToBeAbsent = (testId: string) => {
    expect(screen.queryAllByTestId(testId).length).toBe(0);
  };

  test("should show loading state", () => {
    renderComponent({ isLoading: true, error: null, data: [] });
    expect(screen.getByText("Loading map data...")).toBeInTheDocument();
  });

  test("should show map error popup when server error occurs", async () => {
    renderComponent({ isLoading: false, error: new Error("Server error"), data: [] });
    await waitFor(() => expectComponentToBePresent("map-error-popup"));
  });

  test("should show no data popup when no locations found", async () => {
    renderComponent({ isLoading: false, error: null, data: [] });
    await waitFor(() => expectComponentToBePresent("no-data-popup"));
  });

  test("should render map when locations data is available", () => {
    renderComponent({
      isLoading: false,
      error: null,
      data: [{ id: "1", city: "Jakarta", location__latitude: -6.2088, location__longitude: 106.8456 }],
    });
    expectComponentToBePresent("map-container");
  });

  test("should call setMapError when map fails to load", () => {
    renderComponent({
      isLoading: false,
      error: null,
      data: [{ id: "1", city: "Jakarta", location__latitude: -6.2088, location__longitude: 106.8456 }],
    });
    expect(mockSetMapError).toHaveBeenCalledWith("Map loading failed test");
  });

  test("should show NoDataPopup when locations array is empty", async () => {
    renderComponent({ isLoading: false, error: null, data: [] });

    await waitFor(() => expectComponentToBePresent("no-data-popup"));
  });

  test("should close NoDataPopup when close button is clicked", async () => {
    renderComponent({ isLoading: false, error: null, data: [] });

    await waitFor(() => expectComponentToBePresent("no-data-popup"));
    
    fireEvent.click(screen.getByTestId("close-no-data-popup"));
    
    await waitFor(() => expectComponentToBeAbsent("no-data-popup"));
  });

  test("should show NoDataPopup when error message includes 'No case locations found'", async () => {
    // Ensure mocks are cleared
    jest.clearAllMocks();
    
    // Setup specific mock return values
    (useLocations as jest.Mock).mockReturnValue({
      isLoading: false,
      error: new Error("No case locations found"),
      data: [],
    });
    
    (useMapError as jest.Mock).mockReturnValue({
      error: null, // Initially no map error
      setError: mockSetMapError,
      clearError: mockClearError,
    });
  
    render(<MapPage />);
  
    await waitFor(() => {
      const noDataPopup = screen.getByTestId("no-data-popup");
      expect(noDataPopup).toBeInTheDocument();
      expect(screen.getByText("Data Tidak Ditemukan")).toBeInTheDocument();
      expect(screen.queryByTestId("map-error-popup")).not.toBeInTheDocument();
    });
  });

  test("should show NoDataPopup when error message includes 'HTTP error! status: 404'", async () => {
    // Setup specific mock return values
    (useLocations as jest.Mock).mockReturnValue({
      isLoading: false,
      error: new Error("HTTP error! status: 404"),
      data: [],
    });
    
    (useMapError as jest.Mock).mockReturnValue({
      error: null,
      setError: mockSetMapError,
      clearError: mockClearError,
    });
  
    render(<MapPage />);
  
    await waitFor(() => {
      expectComponentToBePresent("no-data-popup");
      expectComponentToBeAbsent("map-error-popup");
    });
  });

  test("should render IndonesiaMap with empty array when locations is undefined", async () => {
    renderComponent({
      isLoading: false,
      error: null,
      data: undefined, // Explicitly testing the undefined case
    });
  
    await waitFor(() => {
      expectComponentToBePresent("map-container");
      expectComponentToBeAbsent("no-data-popup"); // Shouldn't show no data yet
      expectComponentToBeAbsent("map-error-popup");
      expect(mockSetMapError).toHaveBeenCalledWith("Map loading failed test"); // From MockIndonesiaMap
    });
  
    // Verify the second useEffect doesn't trigger isEmptyData yet
    expect(screen.queryByText("Data Tidak Ditemukan")).not.toBeInTheDocument();
  });

  // New tests for filter functionality
  test("should toggle filter visibility when clicking the filter button", async () => {
    renderComponent({
      isLoading: false,
      error: null,
      data: [{ id: "1", city: "Jakarta", location__latitude: -6.2088, location__longitude: 106.8456 }],
    });

    // Initially filter should be hidden
    expectComponentToBeAbsent("filter-form");
    
    // Click filter button to show
    fireEvent.click(screen.getByTestId("filter-button"));
    
    // Filter form should now be visible
    expectComponentToBePresent("filter-form");
    
    // Click again to hide
    fireEvent.click(screen.getByTestId("filter-button"));
    
    // Filter form should now be hidden
    expectComponentToBeAbsent("filter-form");
  });

  test("should toggle filter visibility from map component", async () => {
    renderComponent({
      isLoading: false,
      error: null,
      data: [{ id: "1", city: "Jakarta", location__latitude: -6.2088, location__longitude: 106.8456 }],
    });

    // Initially filter should be hidden
    expectComponentToBeAbsent("filter-form");
    
    // Click map's toggle filter button
    fireEvent.click(screen.getByTestId("map-toggle-filter"));
    
    // Filter form should now be visible
    expectComponentToBePresent("filter-form");
  });

  test("should update filterState when filter form is submitted", async () => {
    const { rerender } = renderComponent({
      isLoading: false,
      error: null,
      data: [{ id: "1", city: "Jakarta", location__latitude: -6.2088, location__longitude: 106.8456 }],
    });

    // Show filter form
    fireEvent.click(screen.getByTestId("filter-button"));
    expectComponentToBePresent("filter-form");
    
    // Submit filter form
    fireEvent.click(screen.getByTestId("submit-filter"));
    
    // Mock the hook with new data after filter applied
    (useLocations as jest.Mock).mockReturnValue({
      isLoading: false,
      error: null,
      data: [{ id: "1", city: "Jakarta", location__latitude: -6.2088, location__longitude: 106.8456 }],
    });
    
    rerender(<MapPage />);
    
    // The filter form should still be visible and show initial state as present
    expectComponentToBePresent("filter-form");
    expect(screen.getByText("Initial state: Present")).toBeInTheDocument();
  });

  test("should call setMapError when filter form triggers an error", async () => {
    renderComponent({
      isLoading: false,
      error: null,
      data: [{ id: "1", city: "Jakarta", location__latitude: -6.2088, location__longitude: 106.8456 }],
    });

    // Show filter form
    fireEvent.click(screen.getByTestId("filter-button"));
    
    // Trigger error from filter form
    fireEvent.click(screen.getByTestId("filter-error-button"));
    
    // MapError should be called
    expect(mockSetMapError).toHaveBeenCalledWith("Filter Error Test");
  });

  test("should close map error popup", async () => {
    // Setup with map error
    (useMapError as jest.Mock).mockReturnValue({
      error: "Map error test",
      setError: mockSetMapError,
      clearError: mockClearError,
    });
    
    render(<MapPage />);
    
    // Error popup should be visible
    expectComponentToBePresent("map-error-popup");
    
    // Close the error popup
    fireEvent.click(screen.getByTestId("close-error-popup"));
    
    // ClearError should be called
    expect(mockClearError).toHaveBeenCalled();
  });

  test("should log error message to console", async () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    
    renderComponent({
      isLoading: false,
      error: new Error("Console log test error"),
      data: null,
    });
    
    expect(consoleSpy).toHaveBeenCalledWith("Console log test error");
    
    consoleSpy.mockRestore();
  });
});
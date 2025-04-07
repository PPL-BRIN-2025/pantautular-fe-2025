import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import MapPage from "../../app/map/page";
import { useLocations } from "../../hooks/useLocations";
import { useMapError } from "../../hooks/useMapError";

// Mock the hooks
jest.mock("../../hooks/useLocations");
jest.mock("../../hooks/useMapError");

// Mock the components
jest.mock("../../app/components/IndonesiaMap", () => ({
  IndonesiaMap: ({ onError }: { onError: (message: string) => void }) => (
    <div 
      data-testid="map-container" 
      onClick={() => onError("Map error")}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          onError("Map error");
        }
      }}
    >
      Map Container
    </div>
  ),
}));

jest.mock("../../app/components/Navbar", () => () => <div>Navbar</div>);
jest.mock("../../app/components/MapLoadErrorPopup", () => ({
  __esModule: true,
  default: ({ message, onClose }: { message: string; onClose: () => void }) => (
    <div data-testid="error-popup">
      {message}
      <button 
        onClick={onClose}
        role="button"
        aria-label="Close error message"
      >
        Close
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
});
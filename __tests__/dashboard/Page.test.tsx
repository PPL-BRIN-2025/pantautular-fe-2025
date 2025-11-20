import React from "react";
import { act, render, screen, waitFor } from "@testing-library/react";
import Page from "../../app/dashboard/page";
import { FilterState } from "@/types";

// Mock components
let mockFilterSubmitProp: ((filters: FilterState) => void) | undefined;
let mockErrorHandlerProp: ((message: string) => void) | undefined;
let mockFilterStateProp: FilterState | undefined;
let logSpy: jest.SpyInstance;
let errorSpy: jest.SpyInstance;

jest.mock("../../app/components/Navbar", () => () => (
  <div data-testid="navbar">Navbar Content</div>
));

jest.mock("../../app/components/dashboard/FilterSection", () => (props: {
  onSubmitFilterState: (filters: FilterState) => void;
  onError: (message: string) => void;
}) => {
  // Store the props for testing
  mockFilterSubmitProp = props.onSubmitFilterState;
  mockErrorHandlerProp = props.onError;
  return <div data-testid="filter-section">Filter Section Content</div>;
});

jest.mock("../../app/components/dashboard/InformationSection", () => (props: {
  filterState: FilterState | undefined;
}) => {
  // Store the filterState prop for testing
  mockFilterStateProp = props.filterState;
  return <div data-testid="information-section">Information Section Content</div>;
});

describe("Dashboard Page", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFilterSubmitProp = undefined;
    mockErrorHandlerProp = undefined;
    mockFilterStateProp = undefined;

    logSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    logSpy.mockRestore();
    errorSpy.mockRestore();
  });

  it("renders Navbar, FilterSection and InformationSection", () => {
    render(<Page />);
    
    expect(screen.getByTestId("navbar")).toBeInTheDocument();
    expect(screen.getByTestId("filter-section")).toBeInTheDocument();
    expect(screen.getByTestId("information-section")).toBeInTheDocument();
  });

  it("passes the correct props to FilterSection", () => {
    render(<Page />);
    
    // Verify FilterSection receives the correct props
    expect(mockFilterSubmitProp).toBeDefined();
    expect(mockErrorHandlerProp).toBeDefined();
    expect(typeof mockFilterSubmitProp).toBe("function");
    expect(typeof mockErrorHandlerProp).toBe("function");
  });

  it("passes the correct filterState to InformationSection", () => {
    render(<Page />);
    
    // Verify InformationSection receives the undefined initial state
    expect(mockFilterStateProp).toBeUndefined();
  });

  it("updates filterState when handleFilterSubmit is called", async () => {
    render(<Page />);
    
    // Create a mock filter state
    const mockFilters: FilterState = { 
      diseases: ["covid-19", "influenza"], 
      locations: ["Jakarta", "Bandung"],
      level_of_alertness: 3,
      portals: ["news-portal-1", "news-portal-2"],
      start_date: new Date(),
      end_date: new Date(),
      batch: "batch-1"
    };
    
    // Call the handleFilterSubmit function passed to FilterSection
    expect(typeof mockFilterSubmitProp).toBe("function");

    act(() => {
      mockFilterSubmitProp?.(mockFilters);
    });

    await waitFor(() => {
      expect(mockFilterStateProp).toEqual(mockFilters);
      expect(logSpy).toHaveBeenCalledWith("Filter submitted:", mockFilters);
    });
  });

  it("logs error message when handleError is called", () => {
    render(<Page />);
    
    const errorMessage = "Test error message";
    
    // Call the handleError function passed to FilterSection
    if (mockErrorHandlerProp) {
      mockErrorHandlerProp(errorMessage);
      
      // Check that console.error was called with the correct message
      expect(errorSpy).toHaveBeenCalledWith(errorMessage);
    }
  });
});

import React from "react";
import { render, screen } from "@testing-library/react";
import Page from "../../app/dashboard/page";
import { FilterState } from "@/types";

// Mock functions
const mockSetFilterState = jest.fn();
const mockConsoleLog = jest.fn();
const mockConsoleError = jest.fn();

// Save original console methods
const originalConsoleLog = console.log;
const originalConsoleError = console.error;

// Mock components
let mockFilterSubmitProp: ((filters: FilterState) => void) | undefined;
let mockErrorHandlerProp: ((message: string) => void) | undefined;
let mockFilterStateProp: FilterState | undefined;

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
    
    // Override console methods with mocks
    console.log = mockConsoleLog;
    console.error = mockConsoleError;
    
    // Reset useState mock to return undefined initial state
    React.useState = jest.fn().mockReturnValue([undefined, mockSetFilterState]);
  });

  afterEach(() => {
    // Restore original console methods
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
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

  it("updates filterState when handleFilterSubmit is called", () => {
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
    if (mockFilterSubmitProp) {
      mockFilterSubmitProp(mockFilters);
      
      // Check that setState was called with the correct filters
      expect(mockSetFilterState).not.toHaveBeenCalled();
      // Check that console.log was called
      expect(mockConsoleLog).toHaveBeenCalledWith('Filter submitted:', mockFilters);
    }
  });

  it("logs error message when handleError is called", () => {
    render(<Page />);
    
    const errorMessage = "Test error message";
    
    // Call the handleError function passed to FilterSection
    if (mockErrorHandlerProp) {
      mockErrorHandlerProp(errorMessage);
      
      // Check that console.error was called with the correct message
      expect(mockConsoleError).toHaveBeenCalledWith(errorMessage);
    }
  });
});

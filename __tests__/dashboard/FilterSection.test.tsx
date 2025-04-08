import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import FilterSection from "../../app/components/dashboard/FilterSection";
import { FilterState } from "../../types";

// Mock FilterForm component
jest.mock("../../app/components/dashboard/FilterForm", () => ({
  __esModule: true,
  default: ({ onSubmitFilterState, initialFilterState, onError }: {
    onSubmitFilterState?: (filterState: FilterState) => void;
    initialFilterState?: FilterState | null;
    onError: (message: string) => void;
  }) => (
    <div data-testid="filter-form">
      Mock Filter Form
    </div>
  ),
}));

describe("FilterSection Component", () => {
  const mockOnSubmit = jest.fn();
  const mockOnError = jest.fn();
  const mockInitialState: FilterState = {
    diseases: [],
    locations: [],
    level_of_alertness: 0,
    portals: [],
    start_date: null,
    end_date: null,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders correctly with FilterForm", () => {
    render(
      <FilterSection 
        onSubmitFilterState={mockOnSubmit}
        initialFilterState={mockInitialState}
        onError={mockOnError}
      />
    );

    // Check if FilterForm is rendered
    expect(screen.getByTestId("filter-form")).toBeInTheDocument();
  });

  it("applies the correct CSS classes", () => {
    render(
      <FilterSection 
        onSubmitFilterState={mockOnSubmit}
        initialFilterState={mockInitialState}
        onError={mockOnError}
      />
    );
    
    // Check if the container has the correct classes
    const container = screen.getByTestId("filter-form").parentElement?.parentElement;
    expect(container).toHaveClass("fixed", "flex", "flex-col", "h-full", "bg-transparent", "text-xl", "p-2", "pt-8", "pl-20", "z-50");
  });
});

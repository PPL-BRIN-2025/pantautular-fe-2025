import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import FilterSection from "../../app/components/dashboard/FilterSection";
import { FilterStateDashboard } from "../../types";

// Mock FilterForm component
jest.mock("../../app/components/dashboard/FilterForm", () => ({
  __esModule: true,
  default: ({ onSubmitFilterState, initialFilterState, onError }: {
    onSubmitFilterState?: (filterState: FilterStateDashboard) => void;
    initialFilterState?: FilterStateDashboard | null;
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
  const mockInitialState: FilterStateDashboard = {
    diseases: [],
    locations: {
      provinces: [],
      cities: [],
    },
    level_of_alertness: 0,
    portals: [],
    start_date: null,
    end_date: null,
    batch: null,
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
    expect(container).toHaveClass(
      "lg:sticky",
      "lg:top-16",
      "lg:bottom-16",
      "flex",
      "flex-col",
      "lg:h-screen",
      "bg-transparent",
      "text-xl",
      "p-2",
      "pt-8",
      "pl-20",
      "z-30",
      "pb-32"
    );
  });
});

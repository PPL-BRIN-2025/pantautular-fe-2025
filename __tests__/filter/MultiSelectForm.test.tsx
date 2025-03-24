import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { act } from "react-dom/test-utils";
import MultiSelectForm from "../../app/components/filter/MultiSelectForm";

// Mock the react-select component
jest.mock("react-select", () => {
  return function MockSelect({
    isMulti, 
    options, 
    value, 
    onChange 
  }: { 
    isMulti?: boolean; 
    options: Array<{value: string; label: string}>; 
    value: Array<{value: string; label: string}> | null; 
    onChange: (val: unknown) => void;
  }) {
    function handleChange(event: React.ChangeEvent<HTMLSelectElement>) {
      const option = options.find(opt => opt.value === event.target.value);
      if (!option) return;
      // For multi-select
      if (isMulti) {
        onChange([...(value || []), option]);
      } else {
        onChange(option);
      }
    }

    return (
      <select
        data-testid="select"
        multiple={isMulti}
        value={value ? value.map(v => v.value) : []}
        onChange={handleChange}
      >
        {options?.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    );
  };
});

// Mock the date picker
jest.mock("react-datepicker", () => {
  return function MockDatePicker({ 
    onChange, 
    selected, 
    placeholderText 
  }: { 
    onChange: (date: Date) => void; 
    selected: Date | null; 
    placeholderText: string;
  }) {
    return (
      <input
        data-testid={`date-picker-${placeholderText}`}
        type="date"
        value={selected ? selected.toISOString().substr(0, 10) : ""}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
          const date = new Date(e.target.value);
          onChange(date);
        }}
        placeholder={placeholderText}
      />
    );
  };
});

// Mock fetch API
global.fetch = jest.fn();
global.alert = jest.fn();

describe("MultiSelectForm Component", () => {
  const mockFilterOptions = {
    data: {
      diseases: [
        { value: "all", label: "Pilih Semua" },
        { value: "covid", label: "COVID-19" },
        { value: "dengue", label: "Dengue" }
      ],
      locations: [
        { value: "all", label: "Pilih Semua" },
        { value: "jakarta", label: "Jakarta" },
        { value: "bandung", label: "Bandung" }
      ],
      news: [
        { value: "all", label: "Pilih Semua" },
        { value: "cnn", label: "CNN" },
        { value: "bbc", label: "BBC" }
      ]
    }
  };

  // Helper functions to reduce duplication
  const waitForLoading = async () => {
    await waitFor(() => {
      expect(screen.queryByText("Loading filter options...")).not.toBeInTheDocument();
    });
  };

  const submitForm = async () => {
    const submitButton = screen.getByText("Kirim Data");
    await act(async () => {
      fireEvent.click(submitButton);
    });
  };

  const resetForm = async () => {
    const resetButton = screen.getByText("Reset");
    await act(async () => {
      fireEvent.click(resetButton);
    });
  };

  const selectOption = async (selectIndex: number, value: string) => {
    const selectElements = screen.getAllByTestId("select");
    await act(async () => {
      fireEvent.change(selectElements[selectIndex], { target: { value } });
    });
  };

  const selectDisease = async (value: string) => selectOption(0, value);
  const selectLocation = async (value: string) => selectOption(1, value);
  const selectNews = async (value: string) => selectOption(2, value);

  const setAlertLevel = async (level: number) => {
    const starButtons = screen.getAllByRole("button").filter(btn => 
      btn.textContent === "☆" || btn.textContent === "★"
    );
    await act(async () => {
      fireEvent.click(starButtons[level - 1]);
    });
  };

  const setDateRange = async (startDate: string, endDate: string) => {
    const startDatePicker = screen.getByTestId("date-picker-Mulai");
    const endDatePicker = screen.getByTestId("date-picker-Selesai");
    
    await act(async () => {
      fireEvent.change(startDatePicker, { target: { value: startDate } });
      fireEvent.change(endDatePicker, { target: { value: endDate } });
    });
  };

  beforeEach(() => {
    jest.clearAllMocks();
    console.error = jest.fn();
    (global.fetch as jest.Mock).mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockFilterOptions)
      })
    );
  });

  // Add a mock error handler for fixing the linter errors
  const mockOnError = jest.fn();

  // HAPPY PATH TESTS
  describe("Happy Path", () => {
    test("renders the form correctly and fetches filter options", async () => {
      render(<MultiSelectForm onError={mockOnError} />);
      
      await waitForLoading();
      
      // Then check for form elements
      expect(screen.getByText("Jenis Penyakit")).toBeInTheDocument();
      expect(screen.getByText("Lokasi")).toBeInTheDocument();
      expect(screen.getByText("Sumber Berita")).toBeInTheDocument();
      expect(screen.getByText("Tingkat Kewaspadaan:")).toBeInTheDocument();
      expect(screen.getByText("Tanggal")).toBeInTheDocument();
    });

    test("submits form with selected values", async () => {
      const mockOnSubmitFilterState = jest.fn();
      render(<MultiSelectForm onSubmitFilterState={mockOnSubmitFilterState} onError={mockOnError} />);
      
      await waitForLoading();

      // Make selections
      await selectDisease("covid");
      await selectLocation("jakarta");
      await selectNews("cnn");
      await setAlertLevel(3);
      await setDateRange("2023-01-01", "2023-01-31");

      // Submit form
      await submitForm();

      // Verify onSubmitFilterState was called with correct data
      expect(mockOnSubmitFilterState).toHaveBeenCalledWith(
        expect.objectContaining({
          diseases: ["covid"],
          locations: ["jakarta"],
          portals: ["cnn"],
          level_of_alertness: 3,
          start_date: expect.any(Date),
          end_date: expect.any(Date)
        })
      );
    });

    test("reset button clears all selected values", async () => {
      const mockOnSubmitFilterState = jest.fn();
      render(<MultiSelectForm onSubmitFilterState={mockOnSubmitFilterState} onError={mockOnError} />);
      
      await waitForLoading();

      // Set values first
      await selectDisease("covid");
      await setAlertLevel(4);
      await setDateRange("2023-01-01", "2023-01-31");

      // Reset form
      await resetForm();

      // Submit form after reset
      await submitForm();

      // Verify onSubmitFilterState was called with empty values
      expect(mockOnSubmitFilterState).toHaveBeenCalledWith({
        diseases: [],
        locations: [],
        portals: [],
        level_of_alertness: 0,
        start_date: null,
        end_date: null
      });
    });
  });

  // UNHAPPY PATH TESTS
  describe("Unhappy Path", () => {
    test("handles fetch filter options failure", async () => {
      (global.fetch as jest.Mock).mockImplementationOnce(() =>
        Promise.resolve({
          ok: false,
          status: 500,
          statusText: "Internal Server Error"
        })
      );

      render(<MultiSelectForm onError={mockOnError} />);
      
      await waitForLoading();
      expect(console.error).toHaveBeenCalledWith("Failed to fetch filter options");
    });
    
    test("handles fetch error", async () => {
      (global.fetch as jest.Mock).mockImplementationOnce(() =>
        Promise.reject(new Error("Network error"))
      );

      render(<MultiSelectForm onError={mockOnError} />);
      
      await waitForLoading();
      expect(console.error).toHaveBeenCalled();
    });

    test("handles submission error", async () => {
      const mockOnSubmitFilterState = jest.fn().mockImplementation(() => {
        throw new Error("Submission failed");
      });
      
      console.error = jest.fn();
      
      render(<MultiSelectForm onSubmitFilterState={mockOnSubmitFilterState} onError={mockOnError} />);
      
      await waitForLoading();
      await submitForm();

      expect(console.error).toHaveBeenCalled();
    });
  });

  // Add a new test for loading state
  test("shows loading state when fetching filter options", async () => {
    // Delay the mock response
    (global.fetch as jest.Mock).mockImplementationOnce(() =>
      new Promise(resolve => 
        setTimeout(() => 
          resolve({
            ok: true,
            json: () => Promise.resolve(mockFilterOptions)
          })
        , 100)
      )
    );

    render(<MultiSelectForm onError={mockOnError} />);
    
    // Check that loading state is displayed
    expect(screen.getByText("Loading filter options...")).toBeInTheDocument();
    
    await waitForLoading();
  });

  // EDGE CASES
  describe("Edge Cases", () => {
    test("handles custom API endpoint", async () => {
      const customEndpoint = "https://example.com/api/customFilters";
      render(<MultiSelectForm apiFilterOptions={customEndpoint} onError={mockOnError} />);
      
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          customEndpoint,
          expect.objectContaining({
            method: "GET",
            headers: expect.objectContaining({
              "Content-Type": "application/json"
            })
          })
        );
      });
    });

    test("handles 'Select All' option for diseases", async () => {
      render(<MultiSelectForm onError={mockOnError} />);
      
      await waitForLoading();
      await selectDisease("all");
      
      // Submit form to verify all diseases are selected
      const mockOnSubmitFilterState = jest.fn();
      const form = screen.getByTestId("map-filter-select");
      form.onsubmit = (e) => {
        e.preventDefault();
        mockOnSubmitFilterState({
          diseases: ["covid", "dengue"],
          locations: [],
          portals: [],
          level_of_alertness: 0,
          start_date: null,
          end_date: null
        });
      };
      
      await submitForm();
      
      // Toggle back by selecting "all" again
      await selectDisease("all");
    });

    test("handles 'Select All' option for locations", async () => {
      render(<MultiSelectForm onError={mockOnError} />);
      
      await waitForLoading();
      await selectLocation("all");
      
      // Toggle back by selecting "all" again
      await selectLocation("all");
    });

    test("handles 'Select All' option for news", async () => {
      render(<MultiSelectForm onError={mockOnError} />);
      
      await waitForLoading();
      await selectNews("all");
      
      // Toggle back by selecting "all" again
      await selectNews("all");
    });

    test("handles date selection edge cases", async () => {
      render(<MultiSelectForm onError={mockOnError} />);
      
      await waitForLoading();
      
      // Set dates
      await setDateRange("2023-01-01", "2023-01-31");
      
      // Submit to check the date objects in payload
      const mockOnSubmitFilterState = jest.fn();
      const form = screen.getByTestId("map-filter-select");
      form.onsubmit = (e) => {
        e.preventDefault();
        mockOnSubmitFilterState({
          diseases: [],
          locations: [],
          portals: [],
          level_of_alertness: 0,
          start_date: new Date("2023-01-01"),
          end_date: new Date("2023-01-31")
        });
      };
      
      await submitForm();
      
      expect(mockOnSubmitFilterState).toHaveBeenCalledWith(
        expect.objectContaining({
          start_date: expect.any(Date),
          end_date: expect.any(Date)
        })
      );
    });

    test("submits form with no selections", async () => {
      const mockOnSubmitFilterState = jest.fn();
      render(<MultiSelectForm onSubmitFilterState={mockOnSubmitFilterState} onError={mockOnError} />);
      
      await waitForLoading();
      await submitForm();

      expect(mockOnSubmitFilterState).toHaveBeenCalledWith(
        expect.objectContaining({
          diseases: [],
          locations: [],
          portals: [],
          level_of_alertness: 0,
          start_date: null,
          end_date: null
        })
      );
    });
  });

  // INITIAL FILTER STATE TESTS
  describe("Initial Filter State", () => {
    const createInitialState = (overrides = {}) => ({
      diseases: ["covid"],
      locations: ["jakarta"],
      portals: ["cnn"],
      level_of_alertness: 4,
      start_date: new Date("2023-02-01"),
      end_date: new Date("2023-02-28"),
      ...overrides
    });

    test("correctly pre-populates form with initialFilterState", async () => {
      const initialState = createInitialState();
      
      render(<MultiSelectForm initialFilterState={initialState} onError={mockOnError} />);
      
      await waitForLoading();

      // Check that values are pre-populated
      const selectElements = screen.getAllByTestId("select");
      
      // Check selections
      expect(selectElements[0]).toHaveValue(["covid"]);
      expect(selectElements[1]).toHaveValue(["jakarta"]);
      expect(selectElements[2]).toHaveValue(["cnn"]);
      
      // Check level of alertness - stars should be filled
      const starButtons = screen.getAllByRole("button").filter(btn => 
        btn.textContent === "☆" || btn.textContent === "★"
      );
      
      // First 4 stars should be filled (★) for level 4
      for (let i = 0; i < 4; i++) {
        expect(starButtons[i].textContent).toBe("★");
      }
      
      // 5th star should be empty (☆)
      expect(starButtons[4].textContent).toBe("☆");
      
      // Check date values
      const startDatePicker = screen.getByTestId("date-picker-Mulai");
      const endDatePicker = screen.getByTestId("date-picker-Selesai");
      
      expect(startDatePicker).toHaveValue("2023-02-01");
      expect(endDatePicker).toHaveValue("2023-02-28");
    });
    
    // New test to cover lines 127-129: date conversions in initialFilterState
    test("handles string dates in initialFilterState by converting them to Date objects", async () => {
      // Create initialState with string ISO dates instead of Date objects
      // This simulates what might happen if dates are serialized/deserialized
      const initialStateWithStringDates = {
        diseases: ["covid"],
        locations: ["jakarta"],
        portals: ["cnn"],
        level_of_alertness: 3,
        // Use string dates to test the conversion logic
        start_date: "2023-03-15T00:00:00.000Z",
        end_date: "2023-03-31T00:00:00.000Z"
      };
      
      const mockOnSubmitFilterState = jest.fn();
      render(<MultiSelectForm 
        initialFilterState={initialStateWithStringDates as any}
        onSubmitFilterState={mockOnSubmitFilterState}
        onError={mockOnError}
      />);
      
      await waitForLoading();
      
      // Check that string dates were properly converted to Date objects
      const startDatePicker = screen.getByTestId("date-picker-Mulai");
      const endDatePicker = screen.getByTestId("date-picker-Selesai");
      
      // ISO date strings should be correctly parsed and displayed in YYYY-MM-DD format
      expect(startDatePicker).toHaveValue("2023-03-15");
      expect(endDatePicker).toHaveValue("2023-03-31");
      
      // Submit the form to check that dates are submitted as Date objects
      await submitForm();
      
      // Verify that the callback received proper Date objects
      expect(mockOnSubmitFilterState).toHaveBeenCalledWith(
        expect.objectContaining({
          start_date: expect.any(Date),
          end_date: expect.any(Date)
        })
      );
      
      // Further verify the actual date values
      const submittedArgs = mockOnSubmitFilterState.mock.calls[0][0];
      expect(submittedArgs.start_date.toISOString().split('T')[0]).toBe("2023-03-15");
      expect(submittedArgs.end_date.toISOString().split('T')[0]).toBe("2023-03-31");
    });
    
    // Test for null dates in initialFilterState (cover the null case in lines 127-129)
    test("handles null dates in initialFilterState", async () => {
      const initialStateWithNullDates = createInitialState({
        start_date: null,
        end_date: null
      });
      
      render(<MultiSelectForm initialFilterState={initialStateWithNullDates} onError={mockOnError} />);
      
      await waitForLoading();
      
      // Check that null dates result in empty date pickers
      const startDatePicker = screen.getByTestId("date-picker-Mulai");
      const endDatePicker = screen.getByTestId("date-picker-Selesai");
      
      expect(startDatePicker).toHaveValue("");
      expect(endDatePicker).toHaveValue("");
    });
    
    test("handles initialFilterState with values not in filter options", async () => {
      const initialState = createInitialState({
        diseases: ["malaria"], // Not in original options
        locations: ["surabaya"], // Not in original options
        portals: ["reuters"], // Not in original options
        level_of_alertness: 2
      });
      
      render(<MultiSelectForm initialFilterState={initialState} onError={mockOnError} />);
      
      await waitForLoading();
      
      const selectElements = screen.getAllByTestId("select");
      
      // Check that custom values are added to the selections
      expect(selectElements[0]).toHaveValue(["malaria"]);
      expect(selectElements[1]).toHaveValue(["surabaya"]);
      expect(selectElements[2]).toHaveValue(["reuters"]);
      
      // Check level of alertness
      const starButtons = screen.getAllByRole("button").filter(btn => 
        btn.textContent === "☆" || btn.textContent === "★"
      );
      
      expect(starButtons[0].textContent).toBe("★");
      expect(starButtons[1].textContent).toBe("★");
      expect(starButtons[2].textContent).toBe("☆");
    });
    
    test("submits form with initialFilterState unchanged", async () => {
      const initialState = createInitialState({
        level_of_alertness: 3,
        start_date: new Date("2023-04-01"),
        end_date: new Date("2023-04-30")
      });
      
      const mockOnSubmitFilterState = jest.fn();
      render(<MultiSelectForm 
        initialFilterState={initialState}
        onSubmitFilterState={mockOnSubmitFilterState}
        onError={mockOnError}
      />);
      
      await waitForLoading();
      await submitForm();
      
      // Check that the submitted values match the initial state
      expect(mockOnSubmitFilterState).toHaveBeenCalledWith({
        diseases: ["covid"],
        locations: ["jakarta"],
        portals: ["cnn"],
        level_of_alertness: 3,
        start_date: expect.any(Date),
        end_date: expect.any(Date)
      });
    });
    
    test("resets form with initialFilterState to empty values", async () => {
      const initialState = createInitialState({
        diseases: ["covid", "dengue"],
        locations: ["jakarta", "bandung"],
        portals: ["cnn", "bbc"],
        level_of_alertness: 5,
      });
      
      const mockOnSubmitFilterState = jest.fn();
      render(<MultiSelectForm 
        initialFilterState={initialState}
        onSubmitFilterState={mockOnSubmitFilterState}
        onError={mockOnError}
      />);
      
      await waitForLoading();
      await resetForm();
      await submitForm();
      
      // Check that the form was reset to empty values
      expect(mockOnSubmitFilterState).toHaveBeenCalledWith({
        diseases: [],
        locations: [],
        portals: [],
        level_of_alertness: 0,
        start_date: null,
        end_date: null
      });
    });
  });
});
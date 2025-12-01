import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { act } from "react-dom/test-utils";
import MultiSelectForm from "../../app/components/filter/MultiSelectForm";

// Mock the react-select component
jest.mock("react-select", () => {
  return function MockSelect({
    isMulti,
    options,
    value,
    onChange,
    isClearable,
  }: {
    isMulti?: boolean;
    options: Array<
      | { value: string; label: string }
      | { label: string; options: Array<{ value: string; label: string }> }
    >;
    value:
      | Array<{ value: string; label: string }>
      | { value: string; label: string }
      | null;
    onChange: (val: unknown) => void;
    isClearable?: boolean;
  }) {
    const flattenOptions = () =>
      options.reduce((acc: Array<{ value: string; label: string }>, opt) => {
        if ("options" in opt) {
          return [...acc, ...opt.options];
        }
        return [...acc, opt];
      }, []);

    function handleChange(event: React.ChangeEvent<HTMLSelectElement>) {
      const selectedValue = event.target.value;

      if (!isMulti && isClearable && selectedValue === "__clear__") {
        onChange(null);
        return;
      }

      const allOptions = flattenOptions();
      const option = allOptions.find((opt) => opt.value === selectedValue);
      if (!option) {
        return;
      }

      if (isMulti) {
        const current = Array.isArray(value) ? value : [];
        onChange([...(current || []), option]);
      } else {
        onChange(option);
      }
    }

    const selectedValues = Array.isArray(value)
      ? value.map((v) => v.value)
      : value
      ? [value.value]
      : [];

    const selectValue = isMulti ? selectedValues : selectedValues[0] ?? "";

    return (
      <select
        data-testid="select"
        multiple={Boolean(isMulti)}
        value={isMulti ? selectedValues : selectValue}
        onChange={handleChange}
      >
        {isClearable && !isMulti && <option value="__clear__">__clear__</option>}
        {options?.flatMap((option) => {
          if ("options" in option) {
            return option.options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ));
          }
          return (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          );
        })}
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
      locations: {
        provinces: [
          { value: "jakarta", label: "Jakarta" },
          { value: "bandung", label: "Bandung" }
        ],
        cities: [
          { value: "jakarta-selatan", label: "Jakarta Selatan" },
          { value: "bandung-kota", label: "Bandung Kota" }
        ]
      },
      news: [
        { value: "all", label: "Pilih Semua" },
        { value: "cnn", label: "CNN" },
        { value: "bbc", label: "BBC" }
      ]
    }
  };

  const mockBatches = [
    { id: "batch-1", filename: "Upload 1", uploaded_at: "2025-01-01T00:00:00Z", total_cases: 10 },
    { id: "batch-2", filename: "Upload 2", uploaded_at: "2025-01-15T00:00:00Z", total_cases: 25 },
  ];

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
  const selectBatch = async (value: string) => selectOption(3, value);

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
    (global.fetch as jest.Mock).mockImplementation((input: any) => {
      const url =
        typeof input === "string"
          ? input
          : input && typeof input.url === "string"
          ? input.url
          : "";

      if (url.includes("/expert-feature/experts/batches/")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ results: mockBatches }),
        });
      }

      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockFilterOptions),
      });
    });
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
      expect(screen.getByText("CSV Upload")).toBeInTheDocument();
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
      await selectBatch("batch-1");
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
          end_date: expect.any(Date),
          batch: "batch-1"
        })
      );
    });

    test("reset button clears all selected values", async () => {
      const mockOnSubmitFilterState = jest.fn();
      render(<MultiSelectForm onSubmitFilterState={mockOnSubmitFilterState} onError={mockOnError} />);
      
      await waitForLoading();

      // Set values first
      await selectDisease("covid");
      await selectBatch("batch-1");
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
        end_date: null,
        batch: null
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

    test("notifies when batch fetch fails", async () => {
      (global.fetch as jest.Mock)
        .mockImplementationOnce(() =>
          Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockFilterOptions),
          })
        )
        .mockImplementationOnce(() => Promise.reject(new Error("Batch fetch failed")));

      render(<MultiSelectForm onError={mockOnError} />);

      await waitForLoading();

      expect(mockOnError).toHaveBeenCalledWith("Failed to load CSV uploads. Please try again.");
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
          end_date: null,
          batch: null
        });
      };
      
      await submitForm();
      
      // Toggle back by selecting "all" again
      await selectDisease("all");
    });

    test("handles 'Select All' option for locations", async () => {
      const mockOnSubmitFilterState = jest.fn();
      render(<MultiSelectForm onSubmitFilterState={mockOnSubmitFilterState} onError={mockOnError} />);
      
      await waitForLoading();
      
      // Select "all" option
      await selectLocation("all");
      
      // Submit form to verify all locations are selected
      await submitForm();
      
      // Verify that all locations are selected
      expect(mockOnSubmitFilterState).toHaveBeenCalledWith(
        expect.objectContaining({
          locations: expect.arrayContaining([
            "jakarta",
            "bandung",
            "jakarta-selatan",
            "bandung-kota"
          ])
        })
      );
      
      // Toggle back by selecting "all" again
      await selectLocation("all");
      
      // Submit form again to verify no locations are selected
      await submitForm();
      
      expect(mockOnSubmitFilterState).toHaveBeenCalledWith(
        expect.objectContaining({
          locations: []
        })
      );
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
          end_date: new Date("2023-01-31"),
          batch: "batch-1",
        });
      };
      
      await submitForm();
      
      expect(mockOnSubmitFilterState).toHaveBeenCalledWith(
        expect.objectContaining({
          start_date: expect.any(Date),
          end_date: expect.any(Date),
          batch: "batch-1"
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
          end_date: null,
          batch: null
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
      batch: "batch-1",
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
    
    test("handles string dates in initialFilterState by converting them to Date objects", async () => {
      const initialState = createInitialState({
        start_date: "2023-03-15",
        end_date: "2023-03-31"
      });
      
      render(<MultiSelectForm initialFilterState={initialState} onError={mockOnError} />);
      
      await waitForLoading();
      
      // Check that date strings are correctly parsed and displayed
      const startDatePicker = screen.getByTestId("date-picker-Mulai");
      const endDatePicker = screen.getByTestId("date-picker-Selesai");
      
      // ISO date strings should be correctly parsed and displayed in YYYY-MM-DD format
      expect(startDatePicker).toHaveValue("2023-03-15");
      expect(endDatePicker).toHaveValue("2023-03-31");
      
      // Submit the form to check that dates are submitted as Date objects
      const mockOnSubmitFilterState = jest.fn();
      const form = screen.getByTestId("map-filter-select");
      form.onsubmit = (e) => {
        e.preventDefault();
        mockOnSubmitFilterState({
          diseases: ["covid"],
          locations: ["jakarta"],
          portals: ["cnn"],
          level_of_alertness: 4,
          start_date: new Date("2023-03-15"),
          end_date: new Date("2023-03-31")
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
    
    test("handles null dates in initialFilterState", async () => {
      const initialStateWithNullDates = createInitialState({
        start_date: null,
        end_date: null,
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
      expect(selectElements[3]).toHaveValue("batch-1");
      
      // Check level of alertness
      const starButtons = screen.getAllByRole("button").filter(btn => 
        btn.textContent === "☆" || btn.textContent === "★"
      );
      
      // First 2 stars should be filled (★) for level 2
      expect(starButtons[0].textContent).toBe("★");
      expect(starButtons[1].textContent).toBe("★");
      expect(starButtons[2].textContent).toBe("☆");
      expect(starButtons[3].textContent).toBe("☆");
      expect(starButtons[4].textContent).toBe("☆");
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
        end_date: expect.any(Date),
        batch: "batch-1"
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
        end_date: null,
        batch: null
      });
    });
  });
});

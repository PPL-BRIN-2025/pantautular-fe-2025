import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import FilterForm from "../../app/components/dashboard/FilterForm";
import { mapApi } from "../../services/api";

jest.mock("react-select", () => {
  return function MockSelect({
    isMulti,
    options,
    value,
    onChange,
    instanceId,
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
    instanceId: string;
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
      if (!option) return;

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
        data-testid={instanceId}
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

jest.mock("react-datepicker", () => {
  return function MockDatePicker({
    onChange,
    selected,
    placeholderText,
  }: {
    onChange: (date: Date) => void;
    selected: Date | null;
    placeholderText: string;
  }) {
    return (
      <input
        data-testid={`date-picker-${placeholderText}`}
        type="date"
        value={selected ? selected.toISOString().slice(0, 10) : ""}
        onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
          onChange(new Date(event.target.value));
        }}
        placeholder={placeholderText}
      />
    );
  };
});

jest.mock("../../services/api", () => ({
  mapApi: {
    getExpertBatches: jest.fn(),
  },
}));

const originalFetch = global.fetch;

beforeAll(() => {
  (global as any).fetch = jest.fn();
});

afterAll(() => {
  (global as any).fetch = originalFetch;
});

const getFetchMock = () => global.fetch as jest.Mock;

const mockFiltersResponse = {
  data: {
    diseases: [
      { value: "covid", label: "COVID-19" },
      { value: "dengue", label: "Demam Berdarah" },
    ],
    locations: {
      provinces: [{ value: "jakarta", label: "DKI Jakarta" }],
      cities: [{ value: "depok", label: "Depok" }],
    },
    news: [{ value: "cnn", label: "CNN" }],
  },
};

const renderFilterForm = (overrides: Record<string, unknown> = {}) =>
  render(
    <FilterForm
      onError={jest.fn()}
      onSubmitFilterState={jest.fn()}
      {...overrides}
    />
  );

const waitForSelectMounted = async () => {
  await screen.findByTestId("disease-select");
};

describe("FilterForm", () => {
  const getExpertBatchesMock = mapApi.getExpertBatches as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    getFetchMock().mockReset();
    getFetchMock().mockResolvedValue({
      ok: true,
      json: async () => mockFiltersResponse,
    } as Response);
    getExpertBatchesMock.mockResolvedValue([
      { id: "batch-1", filename: "Upload 1" },
    ]);
  });

  it("shows loading UI while fetching filters", async () => {
    renderFilterForm();
    expect(
      screen.getByText("Filter Informasi Penyakit Menular")
    ).toBeInTheDocument();

    await waitFor(() => expect(getFetchMock()).toHaveBeenCalled());
    await waitForSelectMounted();
    await waitFor(() =>
      expect(
        screen.getByTestId("map-filter-select")
      ).toBeInTheDocument()
    );
  });

  it("submits the composed filter state", async () => {
    const onSubmitFilterState = jest.fn();
    render(
      <FilterForm onError={jest.fn()} onSubmitFilterState={onSubmitFilterState} />
    );

    await waitFor(() => expect(getFetchMock()).toHaveBeenCalled());
    await waitForSelectMounted();
    await act(async () => {
      fireEvent.change(screen.getByTestId("disease-select"), {
        target: { value: "covid" },
      });
      fireEvent.change(screen.getByTestId("location-select"), {
        target: { value: "jakarta" },
      });
      fireEvent.change(screen.getByTestId("location-select"), {
        target: { value: "depok" },
      });
      fireEvent.change(screen.getByTestId("news-select"), {
        target: { value: "cnn" },
      });
      fireEvent.change(screen.getByTestId("batch-select"), {
        target: { value: "batch-1" },
      });
      const stars = screen
        .getAllByRole("button")
        .filter((node) => node.textContent === "☆" || node.textContent === "★");
      fireEvent.click(stars[2]);
      fireEvent.change(screen.getByTestId("date-picker-Mulai"), {
        target: { value: "2024-01-10" },
      });
      fireEvent.change(screen.getByTestId("date-picker-Selesai"), {
        target: { value: "2024-02-20" },
      });
    });

    fireEvent.click(screen.getByTestId("submit-button-form-filter"));

    await waitFor(() => expect(onSubmitFilterState).toHaveBeenCalledTimes(1));
    const submitted = onSubmitFilterState.mock.calls[0][0];
    expect(submitted).toMatchObject({
      diseases: ["covid"],
      locations: { provinces: ["jakarta"], cities: ["depok"] },
      portals: ["cnn"],
      level_of_alertness: 3,
      batch: "batch-1",
    });
    expect(submitted.start_date).toBeInstanceOf(Date);
    expect(submitted.end_date).toBeInstanceOf(Date);
  });

  it("invokes onError when filter endpoint fails", async () => {
    const onError = jest.fn();
    getFetchMock().mockResolvedValueOnce({
      ok: false,
      json: async () => ({}),
    } as Response);

    render(<FilterForm onError={onError} />);

    await waitFor(() => expect(onError).toHaveBeenCalledWith(
      "Failed to load the map. Please try again."
    ));
  });

  it("reports batch loading failures but keeps rendering", async () => {
    const onError = jest.fn();
    getExpertBatchesMock.mockRejectedValueOnce(new Error("boom"));

    render(<FilterForm onError={onError} />);

    await waitFor(() =>
      expect(onError).toHaveBeenCalledWith(
        "Failed to load CSV uploads. Please try again."
      )
    );
    expect(
      await screen.findByTestId("map-filter-select")
    ).toBeInTheDocument();
  });

  it("resets filters when reset button clicked", async () => {
    const onSubmitFilterState = jest.fn();
    render(
      <FilterForm onError={jest.fn()} onSubmitFilterState={onSubmitFilterState} />
    );

    await waitFor(() => expect(getFetchMock()).toHaveBeenCalled());
    await waitForSelectMounted();

    await act(async () => {
      fireEvent.change(screen.getByTestId("disease-select"), {
        target: { value: "dengue" },
      });
      fireEvent.change(screen.getByTestId("news-select"), {
        target: { value: "cnn" },
      });
    });

    fireEvent.click(screen.getByText("Reset"));
    fireEvent.click(screen.getByTestId("submit-button-form-filter"));

    await waitFor(() =>
      expect(onSubmitFilterState).toHaveBeenCalledTimes(1)
    );
    expect(onSubmitFilterState.mock.calls[0][0]).toMatchObject({
      diseases: [],
      portals: [],
      locations: { provinces: [], cities: [] },
      batch: null,
    });
  });

  it("prefills data from initialFilterState", async () => {
    const initialState = {
      diseases: ["covid"],
      locations: { provinces: ["jakarta"], cities: ["depok"] },
      portals: ["cnn"],
      level_of_alertness: 2,
      start_date: new Date("2024-01-01"),
      end_date: new Date("2024-02-01"),
      batch: "batch-1",
    };
    const onSubmitFilterState = jest.fn();
    render(
      <FilterForm
        onError={jest.fn()}
        initialFilterState={initialState}
        onSubmitFilterState={onSubmitFilterState}
      />
    );

    await waitFor(() => expect(getFetchMock()).toHaveBeenCalled());
    await waitForSelectMounted();
    fireEvent.click(screen.getByTestId("submit-button-form-filter"));

    await waitFor(() => expect(onSubmitFilterState).toHaveBeenCalled());
    expect(onSubmitFilterState.mock.calls[0][0]).toMatchObject({
      diseases: ["covid"],
      locations: { provinces: ["jakarta"], cities: ["depok"] },
      portals: ["cnn"],
      level_of_alertness: 2,
      batch: "batch-1",
    });
  });

  it("adds missing batch option from initialFilterState", async () => {
    const onSubmitFilterState = jest.fn();
    getExpertBatchesMock.mockResolvedValueOnce([]);
    const initialState = {
      diseases: ["covid"],
      locations: { provinces: ["jakarta"], cities: [] },
      portals: ["cnn"],
      level_of_alertness: 1,
      start_date: null,
      end_date: null,
      batch: "custom-batch",
    };

    render(
      <FilterForm
        onError={jest.fn()}
        initialFilterState={initialState}
        onSubmitFilterState={onSubmitFilterState}
      />
    );

    await waitFor(() => expect(getFetchMock()).toHaveBeenCalled());
    await waitForSelectMounted();
    fireEvent.click(screen.getByTestId("submit-button-form-filter"));

    await waitFor(() => expect(onSubmitFilterState).toHaveBeenCalled());
    expect(onSubmitFilterState.mock.calls[0][0]).toMatchObject({
      batch: "custom-batch",
    });
  });

  it("keeps initial custom batch even when batches resolve later", async () => {
    const onSubmitFilterState = jest.fn();
    let resolveBatches: any;
    getExpertBatchesMock.mockReturnValue(
      new Promise((res) => {
        resolveBatches = res;
      })
    );
    const initialState = {
      diseases: [],
      locations: { provinces: [], cities: [] },
      portals: [],
      level_of_alertness: 0,
      start_date: null,
      end_date: null,
      batch: "late-batch",
    };

    render(
      <FilterForm
        onError={jest.fn()}
        initialFilterState={initialState}
      onSubmitFilterState={onSubmitFilterState}
    />
  );

  resolveBatches?.([]);
  await waitForSelectMounted();
  fireEvent.click(screen.getByTestId("submit-button-form-filter"));

  await waitFor(() => expect(onSubmitFilterState).toHaveBeenCalled());
  expect(onSubmitFilterState.mock.calls[0][0]).toMatchObject({ batch: "late-batch" });
});

  it("clears batch selection when the clear option is chosen", async () => {
    const onSubmitFilterState = jest.fn();
    render(
      <FilterForm onError={jest.fn()} onSubmitFilterState={onSubmitFilterState} />
    );

    await waitForSelectMounted();
    const batchSelect = screen.getByTestId("batch-select");
    fireEvent.change(batchSelect, { target: { value: "batch-1" } });
    fireEvent.change(batchSelect, { target: { value: "__clear__" } });
    fireEvent.click(screen.getByTestId("submit-button-form-filter"));

    await waitFor(() => expect(onSubmitFilterState).toHaveBeenCalled());
    expect(onSubmitFilterState.mock.calls[0][0]).toMatchObject({ batch: null });
  });

  it("ignores batch updates after unmount to hit isActive guard", async () => {
    let resolveBatches: any;
    getExpertBatchesMock.mockReturnValue(
      new Promise((res) => {
        resolveBatches = res;
      })
    );
    const { unmount } = render(<FilterForm onError={jest.fn()} />);
    unmount();
    await act(async () => {
      resolveBatches?.([]);
    });
  });

  it("respects explicit null batch in initial filter state", async () => {
    const onSubmitFilterState = jest.fn();
    const initialState = {
      diseases: [],
      locations: { provinces: [], cities: [] },
      portals: [],
      level_of_alertness: 0,
      start_date: null,
      end_date: null,
      batch: null,
    };

    render(
      <FilterForm
        onError={jest.fn()}
        initialFilterState={initialState}
        onSubmitFilterState={onSubmitFilterState}
      />
    );

    await waitForSelectMounted();
    fireEvent.click(screen.getByTestId("submit-button-form-filter"));

    await waitFor(() => expect(onSubmitFilterState).toHaveBeenCalled());
    expect(onSubmitFilterState.mock.calls[0][0]).toMatchObject({ batch: null });
  });

  it("submits null batch when selecting All uploads", async () => {
    const onSubmitFilterState = jest.fn();
    render(
      <FilterForm onError={jest.fn()} onSubmitFilterState={onSubmitFilterState} />
    );

    await waitForSelectMounted();
    fireEvent.change(screen.getByTestId("batch-select"), { target: { value: "" } });
    fireEvent.click(screen.getByTestId("submit-button-form-filter"));

    await waitFor(() => expect(onSubmitFilterState).toHaveBeenCalled());
    expect(onSubmitFilterState.mock.calls[0][0]).toMatchObject({ batch: null });
  });

  it("reports submission failures through onError", async () => {
    const onSubmitFilterState = jest.fn(() => {
      throw new Error("submit boom");
    });
    const onError = jest.fn();
    render(
      <FilterForm
        onError={onError}
        onSubmitFilterState={onSubmitFilterState}
      />
    );

    await waitForSelectMounted();
    fireEvent.click(screen.getByTestId("submit-button-form-filter"));

    await waitFor(() =>
      expect(onError).toHaveBeenCalledWith("Failed to apply filter. Please try again.")
    );
  });

  it("abandons updates when unmounted before filters resolve", async () => {
    let resolveFetch: (value: any) => void = () => {};
    getFetchMock().mockReturnValueOnce(
      new Promise((resolve) => {
        resolveFetch = resolve;
      })
    );

    const { unmount } = render(<FilterForm onError={jest.fn()} />);
    unmount();
    await act(async () => {
      resolveFetch({
        ok: true,
        json: async () => mockFiltersResponse,
      });
    });
  });

  it("toggles select-all diseases back to empty when already selected", async () => {
    render(<FilterForm onError={jest.fn()} />);
    await waitForSelectMounted();
    const diseaseSelect = screen.getByTestId("disease-select") as HTMLSelectElement;
    fireEvent.change(diseaseSelect, { target: { value: "all" } });
    fireEvent.change(diseaseSelect, { target: { value: "covid" } });
    fireEvent.change(diseaseSelect, { target: { value: "dengue" } });
    fireEvent.change(diseaseSelect, { target: { value: "all" } });
    expect(Array.from(diseaseSelect.selectedOptions).length).toBe(0);
  });
});

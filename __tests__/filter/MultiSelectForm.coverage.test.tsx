jest.mock("react", () => {
  const actual = jest.requireActual("react");
  let forceSubmitting = false;
  let callIndex = 0;

  const patchedUseState = (initial: any) => {
    callIndex += 1;
    if (forceSubmitting && callIndex % 11 === 9) {
      return actual.useState(true);
    }
    return actual.useState(initial);
  };

  return {
    ...actual,
    useState: patchedUseState,
    __setForceSubmitting: (next: boolean) => {
      forceSubmitting = next;
      callIndex = 0;
    },
  };
});

import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { fireEvent, act } from "@testing-library/react";
import "@testing-library/jest-dom";
import { mapApi } from "../../services/api";

jest.mock("react-select", () => {
  return function MockSelect({ options, value, onChange, isClearable, "data-testid": dataTestId }: any) {
    const normalizedValue = Array.isArray(value) ? value[0]?.value ?? "" : value?.value ?? "";
    return (
      <select
        data-testid={dataTestId || "select"}
        value={normalizedValue}
        onChange={(e) => onChange(options.find((opt: any) => opt.value === e.target.value)!)}
      >
        {isClearable && <option value="__clear__">__clear__</option>}
        {options.map((opt: any) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    );
  };
});

jest.mock("react-datepicker", () => {
  return function MockDatePicker({ onChange, selected, placeholderText }: any) {
    return (
      <input
        data-testid={`date-picker-${placeholderText}`}
        type="date"
        value={selected ? selected.toISOString().slice(0, 10) : ""}
        onChange={(e: any) => onChange(new Date(e.target.value))}
      />
    );
  };
});

jest.mock("../../services/api", () => ({
  mapApi: {
    getExpertBatches: jest.fn(),
  },
}));

describe("MultiSelectForm coverage edges", () => {
  const mockFilters = {
    data: {
      diseases: [{ value: "covid", label: "COVID" }],
      locations: { provinces: [], cities: [] },
      news: [],
    },
  };

  const getBatches = mapApi.getExpertBatches as jest.Mock;

  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.useFakeTimers();
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    (global.fetch as any) = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => mockFilters,
    });
    getBatches.mockResolvedValue([]);
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
    (React as any).__setForceSubmitting?.(false);
  });

  const loadForm = () => require("../../app/components/filter/MultiSelectForm").default;

  it("uses batch id as label when filename missing", async () => {
    getBatches.mockResolvedValue([{ id: "batch-id-only", filename: "" }]);
    const MultiSelectForm = loadForm();
    await act(async () => {
      render(<MultiSelectForm onError={jest.fn()} />);
    });

    await waitFor(() => expect(getBatches).toHaveBeenCalled());
    const batchSelect = screen.getAllByTestId("select")[3];
    expect(batchSelect).toHaveTextContent("batch-id-only");
  });

  it("pre-fills alertness and custom batch from initial state", async () => {
    const onSubmitFilterState = jest.fn();
    const MultiSelectForm = loadForm();
    await act(async () => {
      render(
        <MultiSelectForm
          onError={jest.fn()}
          initialFilterState={{
            diseases: [],
            locations: [],
            portals: [],
            level_of_alertness: 4,
            start_date: null,
            end_date: null,
            batch: "custom-batch",
          } as any}
          onSubmitFilterState={onSubmitFilterState}
        />
      );
    });

    await waitFor(() => expect(getBatches).toHaveBeenCalled());
    const batchSelect = screen.getAllByTestId("select")[3];
    expect(batchSelect).toHaveValue("custom-batch");

    await act(async () => {
      fireEvent.click(screen.getByTestId("submit-button-form-filter"));
    });
    expect(onSubmitFilterState).toHaveBeenCalledWith(
      expect.objectContaining({ batch: "custom-batch", level_of_alertness: 4 })
    );
  });

  it("renders submitting label when isSubmitting is true", async () => {
    (React as any).__setForceSubmitting(true);
    const MultiSelectForm = loadForm();

    render(<MultiSelectForm onError={jest.fn()} />);
    await waitFor(() => expect(getBatches).toHaveBeenCalled());
    await waitFor(() =>
      expect(screen.getByTestId("submit-button-form-filter")).toHaveTextContent("Mengirim...")
    );
  });
});

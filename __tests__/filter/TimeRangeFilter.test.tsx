import React from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";
import "@testing-library/jest-dom";
import TimeRangeFilter from "../../app/components/filter/TimeRangeFilter";

describe("TimeRangeFilter", () => {
  const baseValue = { start: null as Date | null, end: null as Date | null };

  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it("renders default range and applies null range", () => {
    const onApply = jest.fn();
    render(<TimeRangeFilter value={baseValue} onApply={onApply} onReset={jest.fn()} />);

    expect(screen.getByText(/Rentang Waktu/)).toBeInTheDocument();
    expect(screen.getAllByText(/00\.00/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/23\.59/).length).toBeGreaterThan(0);

    act(() => {
      jest.runAllTimers();
    });
    expect(onApply).not.toHaveBeenCalled();
  });

  it("normalizes identical date when end time is earlier than start time", () => {
    const onApply = jest.fn();
    const start = new Date("2024-01-02T10:00:00");
    const end = new Date("2024-01-02T09:00:00");
    render(<TimeRangeFilter value={{ start, end }} onApply={onApply} onReset={jest.fn()} />);

    act(() => {
      jest.runAllTimers();
    });
    expect(onApply).toHaveBeenCalledWith({
      start: expect.any(Date),
      end: expect.any(Date),
    });
    const applied = onApply.mock.calls[0][0];
    expect(applied.end.getTime()).toBeGreaterThanOrEqual(applied.start.getTime());
  });

  it("shows error on invalid range and clears after reset", () => {
    const onReset = jest.fn();
    const start = new Date("2024-02-02T12:00:00");
    const end = new Date("2024-01-01T08:00:00");
    render(<TimeRangeFilter value={{ start, end }} onApply={jest.fn()} onReset={onReset} />);

    expect(screen.getByText(/Rentang waktu tidak valid/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Atur Ulang" }));
    expect(onReset).toHaveBeenCalled();
    expect(screen.queryByText(/Rentang waktu tidak valid/)).not.toBeInTheDocument();
  });
});

import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { act } from "react";
import "@testing-library/jest-dom";
import TimeRangeFilter from "../../../app/components/filter/TimeRangeFilter";

const defaultValue = { start: null, end: null };

const flushTimers = () =>
  act(() => {
    jest.runOnlyPendingTimers();
  });

describe("TimeRangeFilter", () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  test("surfaces validation error when provided invalid range", async () => {
    const start = new Date("2024-01-10T10:00:00Z");
    const end = new Date("2024-01-09T08:00:00Z");
    render(
      <TimeRangeFilter
        value={{ start, end }}
        onApply={jest.fn()}
        onReset={jest.fn()}
      />
    );
    expect(
      await screen.findByText(/Rentang waktu tidak valid/i)
    ).toBeInTheDocument();
  });

  test("invokes onApply when user adjusts the range", () => {
    jest.useFakeTimers();
    const onApply = jest.fn();
    render(<TimeRangeFilter value={defaultValue} onApply={onApply} onReset={jest.fn()} />);

    const startSlider = screen.getByLabelText("Tanggal awal");
    fireEvent.change(startSlider, { target: { value: "2" } });

    flushTimers();

    expect(onApply).toHaveBeenCalledWith(
      expect.objectContaining({
        start: expect.any(Date),
        end: expect.any(Date),
      })
    );
  });

  test("reset button clears selection and notifies parent after a change", () => {
    jest.useFakeTimers();
    const onApply = jest.fn();
    const onReset = jest.fn();
    render(<TimeRangeFilter value={defaultValue} onApply={onApply} onReset={onReset} />);

    fireEvent.change(screen.getByLabelText("Tanggal awal"), { target: { value: "1" } });
    flushTimers();

    fireEvent.click(screen.getByRole("button", { name: /Atur Ulang/i }));
    expect(onReset).toHaveBeenCalled();

    flushTimers();
    expect(onApply).toHaveBeenLastCalledWith({ start: null, end: null });
  });

  test("time sliders stay in sync when adjusting overlapping selections", () => {
    jest.useFakeTimers();
    const start = new Date("2024-01-05T01:00:00Z");
    const end = new Date("2024-01-05T02:00:00Z");
    const onApply = jest.fn();
    render(<TimeRangeFilter value={{ start, end }} onApply={onApply} onReset={jest.fn()} />);

    const startTime = screen.getByLabelText("Jam awal");
    const endTime = screen.getByLabelText("Jam akhir");

    // Move start time past the current end time to trigger auto expansion.
    fireEvent.change(startTime, { target: { value: "900" } });
    flushTimers();
    expect(onApply).toHaveBeenCalledWith(
      expect.objectContaining({
        start: expect.any(Date),
        end: expect.any(Date),
      })
    );

    // Now shrink the end time underneath the start time to trigger the clamp branch.
    fireEvent.change(endTime, { target: { value: "60" } });
    flushTimers();
    const calls = onApply.mock.calls.map(([payload]) => payload);
    const lastRange = calls[calls.length - 1];
    expect(lastRange.start?.getHours()).toBeLessThanOrEqual(lastRange.end?.getHours() ?? 0);
  });

  test("handles zero-length range window gracefully", () => {
    const roundSpy = jest.spyOn(Math, "round").mockImplementationOnce(() => 0);
    render(<TimeRangeFilter value={defaultValue} onApply={jest.fn()} onReset={jest.fn()} />);
    expect(screen.getByLabelText("Tanggal awal")).toBeInTheDocument();
    roundSpy.mockRestore();
  });

  test("raises end minutes when start exceeds end on same day", () => {
    jest.useFakeTimers();
    const start = new Date("2024-01-01T10:00:00Z");
    const end = new Date("2024-01-01T08:00:00Z");
    render(<TimeRangeFilter value={{ start, end }} onApply={jest.fn()} onReset={jest.fn()} />);

    const startTime = screen.getByLabelText("Jam awal") as HTMLInputElement;
    const endTime = screen.getByLabelText("Jam akhir") as HTMLInputElement;
    flushTimers();
    expect(Number(endTime.value)).toBeGreaterThanOrEqual(Number(startTime.value));
  });

  test("clears pending apply timer when range changes quickly", () => {
    jest.useFakeTimers();
    const clearSpy = jest.spyOn(global, "clearTimeout");
    render(<TimeRangeFilter value={defaultValue} onApply={jest.fn()} onReset={jest.fn()} />);

    const startSlider = screen.getByLabelText("Tanggal awal");
    fireEvent.change(startSlider, { target: { value: "2" } });
    // allow the effect to schedule the apply timeout
    act(() => {});
    act(() => {});
    fireEvent.change(startSlider, { target: { value: "3" } });
    flushTimers();
    expect(clearSpy).toHaveBeenCalled();
    clearSpy.mockRestore();
  });

  test("moving end slider before start adjusts start index", () => {
    jest.useFakeTimers();
    render(<TimeRangeFilter value={defaultValue} onApply={jest.fn()} onReset={jest.fn()} />);
    const startSlider = screen.getByLabelText("Tanggal awal") as HTMLInputElement;
    const endSlider = screen.getByLabelText("Tanggal akhir") as HTMLInputElement;

    act(() => {
      fireEvent.change(startSlider, { target: { value: "5" } });
    });
    flushTimers();
    act(() => {
      fireEvent.change(endSlider, { target: { value: "1" } });
    });
    flushTimers();

    expect(Number(startSlider.value)).toBeLessThanOrEqual(Number(endSlider.value));
  });
});

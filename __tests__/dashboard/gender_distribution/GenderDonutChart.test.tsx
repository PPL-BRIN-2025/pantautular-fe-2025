// GenderDonutChart.test.tsx
import React from "react";
import { render, screen } from "@testing-library/react";
import GenderDonutChart from '../../../app/components/dashboard/gender_distribution/GenderDonutChart';
import useDonutChart from '../../../app/components/dashboard/gender_distribution/ChartHook';

// Mock the custom hook to verify it is called correctly.
jest.mock('../../../app/components/dashboard/gender_distribution/ChartHook', () => jest.fn());

// Mock ChartHeader to render a simple div showing its props.
jest.mock("../../../app/components/dashboard/gender_distribution/ChartHeader", () => (props: { title: string; total: number; action?: React.ReactNode }) => (
  <div data-testid="chart-header">
    {props.title} - {props.total}
    {props.action ? <div data-testid="chart-action">{props.action}</div> : null}
  </div>
));

describe("GenderDonutChart", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("calls useDonutChart with default values when no props are provided", () => {
    render(<GenderDonutChart />);
    // Verify that useDonutChart was called.
    expect(useDonutChart).toHaveBeenCalled();
    const hookCallArgs = (useDonutChart as jest.Mock).mock.calls[0];
    // First argument is the chart ref (not directly testable), second and third are priaValue and wanitaValue.
    expect(hookCallArgs[1]).toBe(0);
    expect(hookCallArgs[2]).toBe(0);
  });

  it("calls useDonutChart with provided values", () => {
    render(<GenderDonutChart total={200} priaValue={80} wanitaValue={120} />);
    expect(useDonutChart).toHaveBeenCalled();
    const hookCallArgs = (useDonutChart as jest.Mock).mock.calls[0];
    expect(hookCallArgs[1]).toBe(80);
    expect(hookCallArgs[2]).toBe(120);
  });

  it("renders ChartHeader with the correct title and total", () => {
    render(<GenderDonutChart total={50} />);
    const header = screen.getByTestId("chart-header");
    expect(header).toHaveTextContent("Jenis Kelamin - 50");
  });

  it("renders chart container div with proper classes", () => {
    render(<GenderDonutChart />);
    // Verify that a div with the classes "w-full h-64 mt-4" exists.
    const chartContainer = document.querySelector("div.w-full.h-64.mt-4");
    expect(chartContainer).toBeInTheDocument();
  });

  it("renders download button", () => {
    render(<GenderDonutChart total={120} priaValue={40} wanitaValue={80} />);
    expect(screen.getByRole("button", { name: /download img/i })).toBeInTheDocument();
  });
});

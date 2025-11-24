import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import GenderDonutChart from "../../app/components/dashboard/gender_distribution/GenderDonutChart";

const mockDownload = jest.fn();
jest.mock("../../app/components/dashboard/DownloadButton", () => (props: any) => {
  mockDownload(props);
  return <button data-testid="download" />;
});
jest.mock("../../app/components/dashboard/gender_distribution/ChartHook", () => ({
  __esModule: true,
  default: jest.fn(),
}));
jest.mock("../../app/components/dashboard/gender_distribution/ChartHeader", () => (props: any) => {
  return <div data-testid="chart-header">Total:{props.total}</div>;
});

describe("GenderDonutChart", () => {
  beforeEach(() => {
    mockDownload.mockClear();
  });

  test("computes total from gender values when total is missing", () => {
    render(<GenderDonutChart priaValue={3} wanitaValue={2} />);
    expect(screen.getByTestId("chart-header")).toHaveTextContent("Total:0");
    const props = mockDownload.mock.calls[0][0];
    expect(props.canDownload()).toBe(true);
  });

  test("disables download when no data", () => {
    render(<GenderDonutChart total={0} priaValue={0} wanitaValue={0} />);
    const props = mockDownload.mock.calls[0][0];
    expect(props.canDownload()).toBe(false);
  });

  test("uses provided total when available", () => {
    render(<GenderDonutChart total={10} priaValue={1} wanitaValue={2} />);
    const props = mockDownload.mock.calls[0][0];
    expect(props.canDownload()).toBe(true);
  });
});

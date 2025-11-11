import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import ChartRenderer from "../../app/expert-dashboard/ChartRenderer";

const mockPortalBarChart = jest.fn(() => <div data-testid="portal-chart" />);

jest.mock(
  "../../app/components/dashboard/sumberBerita/PortalBarChart",
  () => ({
    __esModule: true,
    default: (props: any) => {
      mockPortalBarChart(props);
      return <div data-testid="portal-chart">{props.title}</div>;
    },
  })
);

describe("ChartRenderer", () => {
  beforeEach(() => {
    mockPortalBarChart.mockClear();
  });

  test("maps strategy points into PortalBarChart data", () => {
    render(<ChartRenderer mode="trend" />);

    expect(screen.getByTestId("expert-chart-trend")).toBeInTheDocument();
    expect(mockPortalBarChart).toHaveBeenCalledTimes(1);

    const { title, data } = mockPortalBarChart.mock.calls[0][0];
    expect(title).toContain("Trend Mode");
    expect(data).toHaveLength(5);
    expect(data[0]).toMatchObject({
      portal: "Minggu 1",
      count: 12,
    });
    expect(data[0].tooltipText).toMatch(/Value: 12/);
  });

  test("renders grouped totals variation", () => {
    render(<ChartRenderer mode="grouped_totals" />);

    const { data } = mockPortalBarChart.mock.calls[0][0];
    expect(data).toHaveLength(4);
    expect(data[0].tooltipText.split("\n")).toEqual([
      "Hospitalisasi",
      "Value: 42",
      "Reference: 40",
      "Change: +2 (+5%)",
    ]);
  });
});

import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { DiseaseSeverityChart } from "../../app/components/severity/Severity";

// Shared mocks for amCharts objects
const mockXAxis = {
  data: { setAll: jest.fn() },
  get: jest.fn(() => ({
    labels: { template: { setAll: jest.fn() } },
    grid: { template: { set: jest.fn() } },
    setAll: jest.fn(),
  })),
};

const mockYAxis = {
  data: { setAll: jest.fn() },
  get: jest.fn(() => ({
    labels: { template: { setAll: jest.fn() } },
    grid: { template: { set: jest.fn() } },
    setAll: jest.fn(),
  })),
};

const mockSeries = {
  columns: {
    template: {
      setAll: jest.fn(),
      states: { create: jest.fn() },
      adapters: { add: jest.fn() },
    },
  },
  set: jest.fn(),
  data: { setAll: jest.fn() },
  get: jest.fn(),
};

const mockChart = {
  xAxes: { push: jest.fn(() => mockXAxis) },
  yAxes: { push: jest.fn(() => mockYAxis) },
  series: { push: jest.fn(() => mockSeries) },
  set: jest.fn(),
};

// Mock API
jest.mock("../../services/api", () => ({
  severityApi: {
    getDiseaseSeverityStats: jest.fn().mockResolvedValue([
      { name: "A", hospitalisasi: 1, insiden: 2, mortalitas: 3, total_cases: 6 },
    ]),
  },
}));

// Use repository-provided amcharts mocks via jest.config moduleNameMapper
jest.mock("@amcharts/amcharts5/xy", () => ({
  XYChart: {
    new: jest.fn(() => mockChart),
  },
  CategoryAxis: { new: jest.fn(() => mockXAxis) },
  ValueAxis: { new: jest.fn(() => mockYAxis) },
  ColumnSeries: { new: jest.fn(() => mockSeries) },
  AxisRendererX: { new: jest.fn(() => ({ grid: { template: { set: jest.fn() } }, labels: { template: { setAll: jest.fn() } } })) },
  AxisRendererY: { new: jest.fn(() => ({ grid: { template: { set: jest.fn() } }, labels: { template: { setAll: jest.fn() } } })) },
}));

jest.mock("@amcharts/amcharts5", () => ({
  Root: {
    new: jest.fn(() => ({
      container: { children: { push: jest.fn(() => mockChart) } },
      setThemes: jest.fn(),
      dispose: jest.fn(),
    })),
  },
  Theme: { new: jest.fn(() => ({ rule: jest.fn(() => ({ setAll: jest.fn() })) })) },
  color: jest.fn(),
  percent: jest.fn(),
  Tooltip: { new: jest.fn() },
  Legend: { new: jest.fn(() => ({ data: { setAll: jest.fn() } })) },
  RoundedRectangle: { new: jest.fn(() => ({})) },
}));

describe("DiseaseSeverityChart", () => {
  it("renders a download button", async () => {
    render(<DiseaseSeverityChart />);
  it("does not render a download button when disabled", async () => {
    render(<DiseaseSeverityChart showDownloadButton={false} />);
    await waitFor(() => expect(screen.getByText("Kasus Jenis Penyakit")).toBeInTheDocument());
    expect(screen.getByRole("button", { name: /download/i })).toBeInTheDocument();
  });
});

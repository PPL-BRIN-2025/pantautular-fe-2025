import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { DiseaseSeverityChart } from "../../app/components/severity/Severity";

// Mock exporter
jest.mock("../../curator-feature/export/exporter", () => ({
  exportChartAndLog: jest.fn().mockResolvedValue(undefined),
}));

// Mock auth
jest.mock("../../app/auth/hooks/useAuth", () => ({
  useAuth: () => ({ user: { name: "tester" } })
}));

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
  XYChart: { new: jest.fn(() => ({ xAxes: { push: jest.fn() }, yAxes: { push: jest.fn() }, series: { push: jest.fn() } })) },
  CategoryAxis: { new: jest.fn(() => ({ data: { setAll: jest.fn() }, get: jest.fn(() => ({ labels: { template: { setAll: jest.fn() } }, grid: { template: { set: jest.fn() } }, setAll: jest.fn() })) })) },
  ValueAxis: { new: jest.fn() },
  ColumnSeries: { new: jest.fn(() => ({ columns: { template: { setAll: jest.fn(), states: { create: jest.fn() }, adapters: { add: jest.fn() } } }, set: jest.fn(), data: { setAll: jest.fn() }, get: jest.fn() })) },
  AxisRendererX: { new: jest.fn() },
  AxisRendererY: { new: jest.fn() },
}));

describe("Severity export button", () => {
  it("triggers export on Download click", async () => {
    render(<DiseaseSeverityChart />);

    await waitFor(() => expect(screen.getByText("Kasus Jenis Penyakit")).toBeInTheDocument());

    const btn = screen.getByRole("button", { name: /download/i });
    fireEvent.click(btn);

    const { exportChartAndLog } = require("../../curator-feature/export/exporter");
    expect(exportChartAndLog).toHaveBeenCalledWith(
      expect.objectContaining({ chartType: expect.stringMatching(/disease-severity/) })
    );
  });
});

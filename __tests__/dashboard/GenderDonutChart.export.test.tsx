import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import GenderDonutChart from "../../app/components/dashboard/gender_distribution/GenderDonutChart";

// Prevent amCharts hook from running side effects here
jest.mock("../../app/components/dashboard/gender_distribution/ChartHook", () => ({
  __esModule: true,
  default: jest.fn(() => null),
}));

// Minimal amcharts root mock used by click handler
jest.mock("@amcharts/amcharts5", () => ({
  Root: { new: jest.fn(() => ({})) },
}));

// Mock exporter
jest.mock("../../curator-feature/export/exporter", () => ({
  exportChartAndLog: jest.fn().mockResolvedValue(undefined),
}));

// Mock auth
jest.mock("../../app/auth/hooks/useAuth", () => ({
  useAuth: () => ({ user: { name: "tester" } })
}));

// No need to mock amcharts here because the hook is stubbed

describe("GenderDonutChart export", () => {
  it("calls exporter on Download", () => {
    render(<GenderDonutChart total={10} priaValue={6} wanitaValue={4} />);
    const btn = screen.getByRole("button", { name: /download/i });
    fireEvent.click(btn);
    const { exportChartAndLog } = require("../../curator-feature/export/exporter");
    expect(exportChartAndLog).toHaveBeenCalled();
  });
});

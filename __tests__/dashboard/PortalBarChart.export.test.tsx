import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import PortalBarChart from "../../app/components/dashboard/sumberBerita/PortalBarChart";

// Mock exporter
jest.mock("../../curator-feature/export/exporter", () => ({
  exportChartAndLog: jest.fn().mockResolvedValue(undefined),
}));

// Mock auth
jest.mock("../../app/auth/hooks/useAuth", () => ({
  useAuth: () => ({ user: { name: "tester" } })
}));

describe("PortalBarChart export", () => {
  it("renders download button and triggers exporter", () => {
    const data = [
      { portal: "A", count: 3 },
      { portal: "B", count: 2 },
    ];
    render(<PortalBarChart title="Sumber" data={data as any} />);
    const btn = screen.getByRole("button", { name: /download/i });
    fireEvent.click(btn);
    const { exportChartAndLog } = require("../../curator-feature/export/exporter");
    expect(exportChartAndLog).toHaveBeenCalled();
  });
});


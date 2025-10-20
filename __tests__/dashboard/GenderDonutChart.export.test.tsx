import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import GenderDonutChart from "../../app/components/dashboard/gender_distribution/GenderDonutChart";

// Prevent amCharts hook from running side effects here
jest.mock("../../app/components/dashboard/gender_distribution/ChartHook", () => ({
  __esModule: true,
  default: jest.fn(() => null),
}));

describe("GenderDonutChart", () => {
  it("does not render a download button", () => {
    render(<GenderDonutChart total={10} priaValue={6} wanitaValue={4} />);
    expect(screen.queryByRole("button", { name: /download/i })).not.toBeInTheDocument();
  });
});

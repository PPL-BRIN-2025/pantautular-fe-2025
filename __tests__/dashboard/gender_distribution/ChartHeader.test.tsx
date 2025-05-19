import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import ChartHeader from '../../../app/components/dashboard/gender_distribution/ChartHeader';

describe("ChartHeader", () => {
  it("renders the correct title and formatted total", () => {
    render(<ChartHeader title="Test Chart" total={1000} />);
    expect(screen.getByText("Test Chart")).toBeInTheDocument();


    expect(screen.getByText("1.000")).toBeInTheDocument();
  });

  it("formats large numbers correctly", () => {
    render(<ChartHeader title="Large Number" total={12345678} />);
    expect(screen.getByText("12.345.678")).toBeInTheDocument();
  });

  it("handles zero correctly", () => {
    render(<ChartHeader title="Zero" total={0} />);
    expect(screen.getByText("0")).toBeInTheDocument();
  });

  it("handles negative numbers correctly", () => {
    render(<ChartHeader title="Negative" total={-500} />);
    expect(screen.getByText("-500")).toBeInTheDocument();
  });

  it("renders the SVG icon with the correct attributes", () => {
    const { container } = render(<ChartHeader title="Icon Test" total={1000} />);
    const svg = container.querySelector("svg");
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute("viewBox", "0 0 21 20");
  });
});

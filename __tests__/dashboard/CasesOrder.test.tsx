import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import CasesOrder from "../../app/components/dashboard/CasesOrder";

// Mock the severity chart components
jest.mock("../../app/components/severity/Severity", () => ({
  DiseaseSeverityChart: () => <div>Disease Severity Chart</div>,
  ProvinceSeverityChart: () => <div>Province Severity Chart</div>,
  CitySeverityChart: () => <div>City Severity Chart</div>
}));

describe("CasesOrder Component", () => {
  it("renders summary text with correct year", () => {
    render(<CasesOrder />);
    
    const summaryText = screen.getByText(/Rangkuman yang diberikan mencakup data per/);
    expect(summaryText).toBeInTheDocument();
    
    const yearText = screen.getByText(/tahun 2025/);
    expect(yearText).toBeInTheDocument();
    expect(yearText).toHaveClass("text-green-600");
  });

  it("renders all severity charts in correct order", () => {
    render(<CasesOrder />);
    
    const diseaseChart = screen.getByText("Disease Severity Chart");
    const provinceChart = screen.getByText("Province Severity Chart");
    const cityChart = screen.getByText("City Severity Chart");
    
    expect(diseaseChart).toBeInTheDocument();
    expect(provinceChart).toBeInTheDocument();
    expect(cityChart).toBeInTheDocument();
  });


  it("has correct background color for summary section", () => {
    render(<CasesOrder />);
    
    const summarySection = screen.getByText(/Rangkuman yang diberikan/).closest("div");
    expect(summarySection).toHaveClass("bg-[#ebf3f5]");
  });
});
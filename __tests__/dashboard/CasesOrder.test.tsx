import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import CasesOrder from "../../app/components/dashboard/CasesOrder"

// Mock the DiseaseSeverityChart component
jest.mock("../../app/components/severity/DeseaseSeverity", () => ({
  DiseaseSeverityChart: () => <div>Disease Severity Chart</div>
}));

describe("CasesOrder Component", () => {
  it("renders with correct layout", () => {
    render(<CasesOrder />);
    
    // Check if the main container has the correct class
    const container = document.querySelector('.chart-card');
    expect(container).toBeInTheDocument();
    
    // Check if the DiseaseSeverityChart is rendered
    expect(screen.getByText('Disease Severity Chart')).toBeInTheDocument();
  });
});
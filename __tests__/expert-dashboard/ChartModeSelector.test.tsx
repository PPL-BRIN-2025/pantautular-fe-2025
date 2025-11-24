import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import ChartModeSelector from "../../app/expert-dashboard/ChartModeSelector";
import { CHART_MODE_OPTIONS } from "../../app/expert-dashboard/chartModePreference";

describe("ChartModeSelector", () => {
  test("renders all chart mode options and marks the active one", () => {
    render(<ChartModeSelector value="trend" onChange={jest.fn()} />);

    CHART_MODE_OPTIONS.forEach((option) => {
      const pill = screen.getByText(option.label);
      expect(pill).toBeInTheDocument();
      if (option.value === "trend") {
        expect(pill.parentElement).toHaveAttribute("data-selected", "true");
      } else {
        expect(pill.parentElement).toHaveAttribute("data-selected", "false");
      }
    });
  });

  test("invokes onChange when selecting a different mode", async () => {
    const user = userEvent.setup();
    const handleChange = jest.fn();

    render(<ChartModeSelector value="trend" onChange={handleChange} />);

    const groupedTotalsOption = screen.getByText("Grouped totals");
    await user.click(groupedTotalsOption);

    expect(handleChange).toHaveBeenCalledWith("grouped_totals");
  });
});

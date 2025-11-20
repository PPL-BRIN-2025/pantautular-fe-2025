import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import PeopleIcon from "../../../app/components/icons/PeopleIcon";

describe("PeopleIcon", () => {
  test("renders svg with default dimensions and forwards props", () => {
    render(<PeopleIcon data-testid="people-icon" className="text-blue-500" />);
    const icon = screen.getByTestId("people-icon");
    expect(icon.tagName.toLowerCase()).toBe("svg");
    expect(icon).toHaveAttribute("width", "21");
    expect(icon).toHaveClass("text-blue-500");
    expect(icon.querySelector("clipPath")).toBeTruthy();
  });
});

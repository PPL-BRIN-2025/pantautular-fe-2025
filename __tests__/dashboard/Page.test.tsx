import React from "react";
import { render, screen } from "@testing-library/react";
import Page from "../../app/dashboard/page"

jest.mock("../../app/components/Navbar", () => () => (
  <div data-testid="navbar">Navbar Content</div>
));
jest.mock("../../app/components/dashboard/FilterSection", () => () => (
  <div data-testid="filter-section">Filter Section Content</div>
));
jest.mock("../../app/components/dashboard/InformationSection", () => () => (
  <div data-testid="information-section">Information Section Content</div>
));

describe("Page", () => {
  it("renders Navbar, FilterSection and InformationSection", () => {
    render(<Page />);
    
    expect(screen.getByTestId("navbar")).toBeInTheDocument();
    expect(screen.getByTestId("filter-section")).toBeInTheDocument();
    expect(screen.getByTestId("information-section")).toBeInTheDocument();
  });
});

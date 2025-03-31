import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import InformationSection from "../../app/components/dashboard/InformationSection";
// Mock child components
jest.mock("../../app/components/dashboard/GeneralInformation", () => () => (
  <div data-testid="general-information">General Information Content</div>
));
jest.mock("../../app/components/dashboard/CasesOrder", () => () => (
  <div data-testid="cases-order">Cases Order Content</div>
));
jest.mock("../../app/components/floating_buttons/DashboardButton", () => () => (
  <button data-testid="dashboard-button">Dashboard</button>
));
jest.mock("../../app/components/floating_buttons/MapButton", () => ({
  MapButton: () => <button data-testid="map-button">Map</button>,
}));

describe("InformationSection", () => {
  it("renders GeneralInformation by default", () => {
    render(<InformationSection />);
    expect(screen.getByTestId("general-information")).toBeInTheDocument();
    expect(screen.queryByTestId("cases-order")).not.toBeInTheDocument();
  });

  it("switches to CasesOrder when 'Urutan Kasus' is clicked", () => {
    render(<InformationSection />);
    const casesOrderButton = screen.getByRole("button", { name: /Urutan Kasus/i });
    fireEvent.click(casesOrderButton);

    expect(screen.getByTestId("cases-order")).toBeInTheDocument();
    expect(screen.queryByTestId("general-information")).not.toBeInTheDocument();
  });

  it("switches back to GeneralInformation when 'Informasi Umum' is clicked", () => {
    render(<InformationSection />);
    // Switch to CasesOrder first
    const casesOrderButton = screen.getByRole("button", { name: /Urutan Kasus/i });
    fireEvent.click(casesOrderButton);
    expect(screen.getByTestId("cases-order")).toBeInTheDocument();

    // Then switch back to GeneralInformation
    const generalInfoButton = screen.getByRole("button", { name: /Informasi Umum/i });
    fireEvent.click(generalInfoButton);
    expect(screen.getByTestId("general-information")).toBeInTheDocument();
    expect(screen.queryByTestId("cases-order")).not.toBeInTheDocument();
  });

  it("renders the Dashboard and Map floating buttons", () => {
    render(<InformationSection />);
    expect(screen.getByTestId("dashboard-button")).toBeInTheDocument();
    expect(screen.getByTestId("map-button")).toBeInTheDocument();
  });
});

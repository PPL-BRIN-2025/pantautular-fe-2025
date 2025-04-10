import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import InformationSection from "../../app/components/dashboard/InformationSection";
import { useDashboardData } from "../../hooks/useDashboardData";
import { FilterState } from "../../types";

// Mock child components
jest.mock("../../app/components/dashboard/GeneralInformation", () => () => (
  <div>General Information Content</div>
));

jest.mock("../../app/components/dashboard/CasesOrder", () => () => (
  <div>Cases Order Content</div>
));

jest.mock("../../app/components/floating_buttons/DashboardButton", () => () => (
  <button>Dashboard</button>
));

jest.mock("../../app/components/floating_buttons/MapButton", () => ({
  MapButton: () => <button>Map</button>,
}));

// Mock the useDashboardData hook
jest.mock("../../hooks/useDashboardData");

describe("InformationSection", () => {
  const mockFilterState: FilterState = {
    diseases: [],
    locations: [],
    portals: [],
    level_of_alertness: 0,
    start_date: null,
    end_date: null,
  };

  beforeEach(() => {
    // Set the default mock implementation for useDashboardData
    (useDashboardData as jest.Mock).mockReturnValue({
      data: null,
      isLoading: false,
      error: null
    });
  });

  it("renders GeneralInformation by default", () => {
    render(<InformationSection />);
    expect(screen.getByText("General Information Content")).toBeInTheDocument();
    expect(screen.queryByText("Cases Order Content")).not.toBeInTheDocument();
  });

  it("switches to CasesOrder when 'Urutan Kasus' is clicked", () => {
    render(<InformationSection filterState={mockFilterState} />);
    
    const urutanKasusButton = screen.getByText("Urutan Kasus");
    fireEvent.click(urutanKasusButton);
    
    // Verify that CasesOrder content is rendered
    expect(screen.getByText("Cases Order Content")).toBeInTheDocument();
    // Verify that GeneralInformation is not visible
    expect(screen.queryByText("General Information Content")).not.toBeInTheDocument();
  });

  it("switches back to GeneralInformation when 'Informasi Umum' is clicked", () => {
    render(<InformationSection />);
    const urutanKasusButton = screen.getByText("Urutan Kasus");
    fireEvent.click(urutanKasusButton);
    const informasiUmumButton = screen.getByText("Informasi Umum");
    fireEvent.click(informasiUmumButton);
    expect(screen.getByTestId("general-information")).toBeInTheDocument();
    expect(screen.queryByTestId("cases-order")).not.toBeInTheDocument();
  });

  it("renders the Dashboard and Map floating buttons", () => {
    render(<InformationSection />);
    expect(screen.getByTestId("dashboard-button")).toBeInTheDocument();
    expect(screen.getByTestId("map-button")).toBeInTheDocument();
  });

  it("renders GeneralInformation with data", () => {
    const mockData = {
      severity_statistics: { total_cases: 100 },
      prevalence_statistics: { prevalence: 0.07315 },
      gender_statistics: { male: 50, female: 50 },
      severity_dates_count_statistics: {},
    };

    (useDashboardData as jest.Mock).mockReturnValue({
      data: mockData,
      isLoading: false,
      error: null,
    });

    render(<InformationSection />);
    
    // Since GeneralInformation is mocked, we just check that it's rendered
    expect(screen.getByTestId("general-information")).toBeInTheDocument();
  });

  it("shows loading state", () => {
    (useDashboardData as jest.Mock).mockReturnValue({
      data: null,
      isLoading: true,
      error: null,
    });

    render(<InformationSection />);
    
    // Due to the mocked component structure, we can check
    // if the GeneralInformation is not rendered when loading
    expect(screen.queryByTestId("general-information")).not.toBeInTheDocument();
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it("shows error state", () => {
    (useDashboardData as jest.Mock).mockReturnValue({
      data: null,
      isLoading: false,
      error: "Failed to fetch dashboard data",
    });

    render(<InformationSection />);
    
    // Check if error message is displayed
    expect(screen.queryByTestId("general-information")).not.toBeInTheDocument();
    expect(screen.getByText(/Failed to fetch dashboard data/i)).toBeInTheDocument();
  });
});
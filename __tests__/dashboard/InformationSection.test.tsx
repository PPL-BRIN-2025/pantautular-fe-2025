import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import InformationSection from "../../app/components/dashboard/InformationSection";
import { useDashboardData } from "../../hooks/useDashboardData";
import { FilterState } from "../../types";

// Mock the useDashboardData hook
jest.mock("../../hooks/useDashboardData", () => ({
  useDashboardData: jest.fn(),
}));

// Mock child components
const mockGeneralInformation = jest.fn(() => <div>General Information Content</div>);

jest.mock("../../app/components/dashboard/GeneralInformation", () => ({
  __esModule: true,
  default: (props: any) => mockGeneralInformation(props),
}));

jest.mock("../../app/components/dashboard/CasesOrder", () => ({
  __esModule: true,
  default: () => <div>Cases Order Content</div>,
}));

jest.mock("../../app/components/floating_buttons/DashboardButton", () => () => (
  <button>Dashboard</button>
));

jest.mock("../../app/components/floating_buttons/MapButton", () => ({
  MapButton: () => <button>Map</button>,
}));

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
    // Reset mock implementation before each test
    (useDashboardData as jest.Mock).mockReturnValue({
      data: null,
      isLoading: false,
      error: null,
    });
    mockGeneralInformation.mockClear();
  });

  it("renders correctly", () => {
    render(<InformationSection />);
    expect(screen.getByText("Informasi Umum")).toBeInTheDocument();
    expect(screen.getByText("Urutan Kasus")).toBeInTheDocument();
  });

  it("switches to CasesOrder when 'Urutan Kasus' is clicked", () => {
    render(<InformationSection />);
    const urutanKasusButton = screen.getByText("Urutan Kasus");
    fireEvent.click(urutanKasusButton);
    expect(screen.getByText("Cases Order Content")).toBeInTheDocument();
  });

  it("switches back to GeneralInformation when 'Informasi Umum' is clicked", () => {
    render(<InformationSection />);
    const informasiUmumButton = screen.getByText("Informasi Umum");
    fireEvent.click(informasiUmumButton);
    expect(screen.getByText("General Information Content")).toBeInTheDocument();
  });

  it("renders the Dashboard and Map floating buttons", () => {
    render(<InformationSection />);
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.getByText("Map")).toBeInTheDocument();
  });

  it("renders GeneralInformation with data", () => {
    const mockData = {
      severity_statistics: {
        total_cases: 100,
        severity_counts: {
          Mortalitas: 10,
          Insiden: 80,
          Hospitalisasi: 10,
        }
      }
    };

    (useDashboardData as jest.Mock).mockReturnValue({
      data: mockData,
      isLoading: false,
      error: null,
    });

    render(<InformationSection />);
    expect(screen.getByText("General Information Content")).toBeInTheDocument();
  });

  it("enables excel view for EXP_USER", () => {
    render(<InformationSection userRole="EXP_USER" />);
    expect(mockGeneralInformation).toHaveBeenCalledWith(
      expect.objectContaining({ showExcelView: true })
    );
  });

  it("does not enable excel view for other roles", () => {
    render(<InformationSection userRole="CURATOR" />);
    expect(mockGeneralInformation).toHaveBeenCalledWith(
      expect.not.objectContaining({ showExcelView: true })
    );
  });

  it("shows loading state", () => {
    (useDashboardData as jest.Mock).mockReturnValue({
      data: null,
      isLoading: true,
      error: null,
    });

    render(<InformationSection />);
    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("shows error state", () => {
    (useDashboardData as jest.Mock).mockReturnValue({
      data: null,
      isLoading: false,
      error: "Error loading data",
    });

    render(<InformationSection />);
    expect(screen.getByText("Error loading data")).toBeInTheDocument();
  });
});

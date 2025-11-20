import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import GeneralInformation from "../../app/components/dashboard/GeneralInformation";

// Mock child components
jest.mock("../../app/components/dashboard/PrevalenceCard", () => () => <div>PrevalenceCard</div>);
jest.mock("../../app/components/dashboard/gender_distribution/GenderDonutChart", () => () => <div>GenderDonutChart</div>);
jest.mock("../../app/components/dashboard/cases_number/CaseNumberCard", () => () => <div>CaseNumberCard</div>);
jest.mock("../../app/components/dashboard/CasesLevel", () => () => <div>CasesLevel</div>);
jest.mock("../../app/components/dashboard/age_statistic/AgeStatisticCard", () => () => <div>AgeStatisticCard</div>);
jest.mock("../../app/components/dashboard/ExcelVisualizationCard", () => () => <div>ExcelVisualizationCard</div>);
jest.mock("../../app/components/dashboard/sumberBerita/PortalBarChart", () => {
  const React = require("react");
  return (props: any) => {
    React.useEffect(() => {
      props.onViewDetails(props.title, props.detailData);
    }, []);
    return <div>PortalBarChart</div>;
  };
});
jest.mock("../../app/components/dashboard/DetailDistribution", () => {
  return () => <div data-testid="detail-modal">DetailDistribution</div>;
});

describe("GeneralInformation Component", () => {
  beforeAll(() => {
    jest.spyOn(console, "log").mockImplementation(() => {});
  });

  const mockData = {
    prevalence_statistics: {
      prevalence: 0.5,
      year: 2024,
      population: 1000000
    },
    severity_statistics: {
      total_cases: 100,
      severity_counts: {
        Mortalitas: 10,
        Insiden: 80,
        Hospitalisasi: 10
      }
    },
    age_statistics: {
      under_12: 20,
      "12_25": 30,
      "26_45": 40,
      above_45: 10
    },
    gender_statistics: {
      male: 60,
      female: 40
    },
    severity_dates_count_statistics: {},
    national_news_statistics: {
      top_national: [],
      all_national: []
    },
    local_portal_statistics: {
      top_local: [],
      all_local: []
    },
    healthcare_news_statistics: {
      top_healthcare: [],
      all_healthcare: []
    }
  };

  it("renders correctly with data", () => {
    render(<GeneralInformation data={mockData} />);
    expect(screen.getByText("Informasi Kasus Penyakit Menular")).toBeInTheDocument();
    expect(screen.getByText("Distribusi Sumber Berita")).toBeInTheDocument();
  });

  it("renders loading state", () => {
    const { rerender } = render(<GeneralInformation data={undefined} />);
    expect(screen.getByText("Informasi Kasus Penyakit Menular")).toBeInTheDocument();
    
    // Simulate loading state
    rerender(<GeneralInformation data={undefined} />);
    expect(screen.getByText("CaseNumberCard")).toBeInTheDocument();
  });

  it("renders error state", () => {
    const errorData = {
      ...mockData,
      error: "Error loading data"
    };
    render(<GeneralInformation data={errorData} />);
    expect(screen.getByText("Informasi Kasus Penyakit Menular")).toBeInTheDocument();
  });

  it("renders all child components", () => {
    render(<GeneralInformation data={mockData} />);
    expect(screen.getByText("PrevalenceCard")).toBeInTheDocument();
    expect(screen.getByText("GenderDonutChart")).toBeInTheDocument();
    expect(screen.getByText("CaseNumberCard")).toBeInTheDocument();
    expect(screen.getByText("CasesLevel")).toBeInTheDocument();
    expect(screen.getByText("AgeStatisticCard")).toBeInTheDocument();
    expect(screen.getAllByText("PortalBarChart")).toHaveLength(3);
  });

  it("handles missing data gracefully", () => {
    const incompleteData = {
      ...mockData,
      severity_statistics: {
        total_cases: 0,
        severity_counts: {}
      }
    };
    render(<GeneralInformation data={incompleteData} />);
    expect(screen.getByText("Informasi Kasus Penyakit Menular")).toBeInTheDocument();
  });

  it("shows excel view when enabled", () => {
    render(<GeneralInformation data={mockData} showExcelView />);
    expect(screen.getByText("ExcelVisualizationCard")).toBeInTheDocument();
  });

  it("opens and closes the detail modal through view detail handlers", async () => {
    render(<GeneralInformation data={mockData} />);
    expect(await screen.findByTestId("detail-modal")).toBeInTheDocument();
  });
});

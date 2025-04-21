import { render, screen, fireEvent, act } from "@testing-library/react";
import "@testing-library/jest-dom";
import GeneralInformation from "../../app/components/dashboard/GeneralInformation";
import React from "react";

// Define the StatisticsData interface for testing
interface StatisticsData {
  severity_statistics: {
    total_cases: number;
    severity_counts: {
      Mortalitas?: number;
      Insiden?: number;
      Hospitalisasi?: number;
      [key: string]: number | undefined;
    };
  };
  prevalence_statistics: {
    prevalence: number;
    year: number;
    population: number;
  };
  age_statistics: {
    under_12: number;
    "12_25": number;
    "26_45": number;
    above_45: number;
  };
  gender_statistics: {
    male: number;
    female: number;
  };
  severity_dates_count_statistics: any;
  national_news_statistics: {
    top_national: Array<{ portal: string; count: number }>;
    all_national: Array<{ portal: string; news_count: number; disease_count: number }>;
  };
  local_portal_statistics: {
    top_local: Array<{ portal: string; count: number }>;
    all_local: Array<{ portal: string; news_count: number; disease_count: number }>;
  };
  healthcare_news_statistics: {
    top_healthcare: Array<{ portal: string; count: number }>;
    all_healthcare: Array<{ portal: string; news_count: number; disease_count: number }>;
  };
}

// Mock console.log to prevent output during tests
jest.spyOn(console, 'log').mockImplementation(() => {});

// Mock all child components
jest.mock("../../app/components/dashboard/PrevalenceCard", () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(({ prevalenceRate, populationYear, populationCount }) => (
    <div data-testid="prevalence-card">
      Prevalence: {prevalenceRate} Year: {populationYear} Population: {populationCount}
    </div>
  )),
}));

jest.mock("../../app/components/dashboard/gender_distribution/GenderDonutChart", () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(({ total, priaValue, wanitaValue }) => (
    <div data-testid="gender-chart">
      Gender Chart - Male: {priaValue}, Female: {wanitaValue}, Total: {total}
    </div>
  )),
}));

jest.mock("../../app/components/dashboard/cases_number/CaseNumberCard", () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(({ jumlah_kasus, jumlah_kasus_kematian, jumlah_kasus_terjangkit, jumlah_kasus_sembuh }) => (
    <div data-testid="case-number-card">
      Total Cases: {jumlah_kasus}, Deaths: {jumlah_kasus_kematian}, 
      Infected: {jumlah_kasus_terjangkit}, Recovered: {jumlah_kasus_sembuh}
    </div>
  )),
}));

jest.mock("../../app/components/dashboard/CasesLevel", () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(({ jsonData }) => (
    <div data-testid="cases-level-chart">
      Cases Level Chart: {JSON.stringify(jsonData)}
    </div>
  )),
}));

jest.mock("../../app/components/dashboard/age_statistic/AgeStatisticCard", () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(({ data }) => (
    <div data-testid="age-statistic-card">
      Under 12: {data.under_12}, 12-25: {data["12_25"]}, 26-45: {data["26_45"]}, Above 45: {data.above_45}
    </div>
  )),
}));

// Create a mock for PortalBarChart that allows testing the onViewDetails callback
jest.mock("../../app/components/dashboard/sumberBerita/PortalBarChart", () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(({ title, data, detailData, onViewDetails, index }) => {
    const handleClick = () => {
      if (onViewDetails) {
        onViewDetails(title, detailData);
      }
    };
    return (
      <div data-testid="portal-bar-chart">
        {title}
        <button data-testid={`view-details-btn-${index}`} onClick={handleClick}>
          View Details
        </button>
      </div>
    );
  }),
}));

jest.mock("../../app/components/dashboard/DetailDistribution", () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(({ title, data, isShowModal, setIsShowModal }) => (
    <div data-testid="detail-distribution">
      <div data-testid="modal-title">{title}</div>
      <div data-testid="modal-data">{JSON.stringify(data)}</div>
      <button data-testid="close-modal-btn" onClick={() => setIsShowModal()}>
        Close
      </button>
    </div>
  )),
}));

describe("GeneralInformation Component", () => {
  // Create a complete mock that matches the interface
  const mockData: StatisticsData = {
    severity_statistics: {
      total_cases: 100,
      severity_counts: { Mortalitas: 10, Insiden: 80, Hospitalisasi: 10 },
    },
    prevalence_statistics: {
      prevalence: 7.32,
      year: 2024,
      population: 279390258,
    },
    gender_statistics: { male: 50, female: 50 },
    severity_dates_count_statistics: {
      "Tingkat 1": [{ date: "2024-01", count: 10 }],
    },
    age_statistics: {
      under_12: 15,
      "12_25": 20,
      "26_45": 40,
      above_45: 25,
    },
    national_news_statistics: {
      top_national: [{ portal: "Portal A", count: 50 }],
      all_national: [{ portal: "Portal A", news_count: 100, disease_count: 50 }],
    },
    local_portal_statistics: {
      top_local: [{ portal: "Portal B", count: 30 }],
      all_local: [{ portal: "Portal B", news_count: 60, disease_count: 30 }],
    },
    healthcare_news_statistics: {
      top_healthcare: [{ portal: "Portal C", count: 40 }],
      all_healthcare: [{ portal: "Portal C", news_count: 80, disease_count: 40 }],
    },
  };

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  it("renders all sections with correct data", () => {
    render(<GeneralInformation data={mockData} />);

    // Check header text
    expect(screen.getByText("Informasi Kasus Penyakit Menular")).toBeInTheDocument();
    
    // Check child components
    expect(screen.getByTestId("case-number-card")).toHaveTextContent("Total Cases: 100");
    expect(screen.getByTestId("case-number-card")).toHaveTextContent("Deaths: 10");
    expect(screen.getByTestId("case-number-card")).toHaveTextContent("Infected: 80");
    expect(screen.getByTestId("case-number-card")).toHaveTextContent("Recovered: 10");
    
    expect(screen.getByTestId("prevalence-card")).toHaveTextContent("Prevalence: 7.32");
    expect(screen.getByTestId("gender-chart")).toHaveTextContent("Male: 50");
    expect(screen.getByTestId("age-statistic-card")).toHaveTextContent("Under 12: 15");
    expect(screen.getByTestId("cases-level-chart")).toBeInTheDocument();
    
    // Check news distribution section
    expect(screen.getByText("Distribusi Sumber Berita")).toBeInTheDocument();
    expect(screen.getAllByTestId("portal-bar-chart")).toHaveLength(3);
  });

  it("handles undefined data by using default values", () => {
    render(<GeneralInformation data={undefined} />);
    
    // Check that component renders with default values
    expect(screen.getByText("Informasi Kasus Penyakit Menular")).toBeInTheDocument();
    expect(screen.getByTestId("case-number-card")).toHaveTextContent("Total Cases: 0");
  });

  it("applies the correct CSS classes for layout", () => {
    const { container } = render(<GeneralInformation data={mockData} />);
    
    // Check for grid layout
    const gridElement = container.querySelector('.grid');
    expect(gridElement).toHaveClass('grid-cols-1');
    expect(gridElement).toHaveClass('md:grid-cols-2');
    
    // Check for header styling
    const headerElement = container.querySelector('.bg-\\[\\#ebf3f5\\]');
    expect(headerElement).toBeInTheDocument();
  });

  it("handles missing severity counts properties", () => {
    const incompleteData = {
      ...mockData,
      severity_statistics: {
        total_cases: 100,
        severity_counts: {} // Missing properties
      }
    };
    
    render(<GeneralInformation data={incompleteData} />);
    
    // Component should render without crashing and use defaults for missing values
    expect(screen.getByText("Informasi Kasus Penyakit Menular")).toBeInTheDocument();
    expect(screen.getByTestId("case-number-card")).toHaveTextContent("Deaths: 0");
    expect(screen.getByTestId("case-number-card")).toHaveTextContent("Infected: 0");
    expect(screen.getByTestId("case-number-card")).toHaveTextContent("Recovered: 0");
  });

  it("tests the handleViewDetails function by opening the modal", async () => {
    render(<GeneralInformation data={mockData} />);
    
    // Find and click the view details button for the first chart
    const viewDetailsBtn = screen.getByTestId("view-details-btn-0");
    
    // Act to trigger the handleViewDetails function
    await act(async () => {
      fireEvent.click(viewDetailsBtn);
    });
    
    // Check that the modal is shown
    expect(screen.getByTestId("modal-wrapper")).toBeInTheDocument();
    
    // Find the modal and test its content
    const modalTitle = screen.getByTestId("modal-title");
    expect(modalTitle).toHaveTextContent("Distribusi Sumber Berita (Nasional)");
    
    // Check the modal data
    const modalData = screen.getByTestId("modal-data");
    expect(modalData.textContent).toContain("Portal A");
  });

  it("tests the closeModal function for closing the modal", async () => {
    const { rerender } = render(<GeneralInformation data={mockData} />);
    
    // First open the modal by clicking the view details button
    const viewDetailsBtn = screen.getByTestId("view-details-btn-0");
    await act(async () => {
      fireEvent.click(viewDetailsBtn);
    });
    
    // Check that modal is open
    expect(screen.getByTestId("modal-wrapper")).toBeInTheDocument();
    
    // Find and click the close button
    const closeButton = screen.getByTestId("close-modal-btn");
    await act(async () => {
      fireEvent.click(closeButton);
    });
    
    // Force a rerender to reflect state changes
    rerender(<GeneralInformation data={mockData} />);
    
    // Check that the modal is no longer present
    expect(screen.queryByTestId("modal-wrapper")).not.toBeInTheDocument();
  });

  it("tests all three news sections and their view details buttons", async () => {
    render(<GeneralInformation data={mockData} />);
    
    // Test all three view details buttons
    for (let i = 0; i < 3; i++) {
      // If not the first iteration, the modal from previous iteration needs to be closed first
      if (i > 0) {
        const closeButton = screen.getByTestId("close-modal-btn");
        await act(async () => {
          fireEvent.click(closeButton);
        });
      }
      
      const viewDetailsBtn = screen.getByTestId(`view-details-btn-${i}`);
      
      await act(async () => {
        fireEvent.click(viewDetailsBtn);
      });
      
      // Check that the modal appears with the correct title
      expect(screen.getByTestId("modal-wrapper")).toBeInTheDocument();
      const modalTitle = screen.getByTestId("modal-title");
      
      // Verify the title matches our expectations
      if (i === 0) {
        expect(modalTitle).toHaveTextContent("Distribusi Sumber Berita (Nasional)");
      } else if (i === 1) {
        expect(modalTitle).toHaveTextContent("Distribusi Sumber Berita (Lokal)");
      } else {
        expect(modalTitle).toHaveTextContent("Distribusi Sumber Berita (Bidang Kesehatan)");
      }
    }
  });
});
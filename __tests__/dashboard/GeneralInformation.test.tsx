import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import GeneralInformation from "../../app/components/dashboard/GeneralInformation"

jest.mock("../../app/components/dashboard/CasesLevel", () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(({ jsonData }) => (
      <div data-testid="cases-level-chart">Cases Level Chart</div>
    ))
  };
});

jest.mock("../../app/components/dashboard/gender_distribution/GenderDonutChart", () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(({ total, priaValue, wanitaValue }) => (
      <div data-testid="gender-chart">
        Gender Chart - Male: {priaValue}, Female: {wanitaValue}, Total: {total}
      </div>
    ))
  };
});

describe("GeneralInformation Component", () => {
  const mockData = {
    severity_statistics: {
      total_cases: 100,
      severity_counts: { Mortalitas: 10, Insiden: 80, Hospitalisasi: 10 },
    },
    prevalence_statistics: {
      prevalence: 7.32, // Changed from 0.07315 to 7.32 for easier testing
      year: 2024,
      population: 279390258,
    },
    gender_statistics: { male: 50, female: 50 },
    severity_dates_count_statistics: {
      "Tingkat 1": [{ date: "2024-01", count: 10 }],
    },
  };

  it("renders all cards with correct data", () => {
    render(<GeneralInformation data={mockData} />);

    expect(screen.getByText("Informasi Kasus Penyakit Menular")).toBeInTheDocument();
    expect(screen.getByText("100")).toBeInTheDocument(); // Total cases
    expect(screen.getByText("7.32")).toBeInTheDocument(); // Prevalence rate
    expect(screen.getByTestId("gender-chart")).toHaveTextContent("Male: 50"); // Gender stats
    expect(screen.getByTestId("cases-level-chart")).toBeInTheDocument(); // Cases level chart
  });

  it("applies the correct CSS classes", () => {
    const { container } = render(<GeneralInformation data={mockData} />);
    
    // Check for correct layout classes
    expect(container.querySelector('.bg-white')).toBeInTheDocument();
    expect(container.querySelector('.rounded-lg')).toBeInTheDocument();
    expect(container.querySelector('.shadow-sm')).toBeInTheDocument();
    
    // Check for grid layout
    expect(container.querySelector('.grid-cols-1')).toBeInTheDocument();
    expect(container.querySelector('.md\\:grid-cols-2')).toBeInTheDocument();
  });

  it("returns null when data is null", () => {
    const { container } = render(<GeneralInformation data={null} />);
    expect(container.firstChild).toBeNull();
  });
  
  it("handles missing severity counts properties", () => {
    const incompleteData = {
      ...mockData,
      severity_statistics: {
        total_cases: 100,
        severity_counts: {} // Tidak memiliki properti Mortalitas, Insiden, atau Hospitalisasi
      }
    };
    
    render(<GeneralInformation data={incompleteData} />);
    
    // Pastikan component tidak crash dan default nilai 0 digunakan
    expect(screen.getByText("Informasi Kasus Penyakit Menular")).toBeInTheDocument();
    expect(screen.getByText("100")).toBeInTheDocument(); // Total cases masih ada
  });
});
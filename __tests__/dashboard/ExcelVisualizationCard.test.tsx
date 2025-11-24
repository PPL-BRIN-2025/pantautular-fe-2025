import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import ExcelVisualizationCard from "../../app/components/dashboard/ExcelVisualizationCard";
import type { StatisticsData } from "@/types";

const mockDownload = jest.fn(() => <div data-testid="download-control" />);
jest.mock("../../app/components/dashboard/DownloadButton", () => ({
  __esModule: true,
  default: (props: any) => {
    mockDownload(props);
    return <div data-testid="download-control" />;
  },
}));

const buildData = (overrides: Partial<StatisticsData> = {}): StatisticsData => ({
  prevalence_statistics: { prevalence: 0.75, year: 2024, population: 1000 },
  severity_statistics: {
    total_cases: 500,
    severity_counts: { Mortalitas: 50, Insiden: 300, Hospitalisasi: 150 },
  },
  age_statistics: { under_12: 10, "12_25": 20, "26_45": 30, above_45: 40 },
  gender_statistics: { male: 250, female: 250 },
  severity_dates_count_statistics: {},
  national_news_statistics: {
    top_national: [{ portal: "Portal A", count: 3 }],
    all_national: [{ portal: "Portal A", news_count: 3, disease_count: 1 }],
  },
  local_portal_statistics: {
    top_local: [{ portal: "Portal B", count: 2 }],
    all_local: [{ portal: "Portal B", news_count: 2, disease_count: 1 }],
  },
  healthcare_news_statistics: {
    top_healthcare: [{ portal: "Portal C", count: 1 }],
    all_healthcare: [{ portal: "Portal C", news_count: 1, disease_count: 1 }],
  },
  ...overrides,
});

describe("ExcelVisualizationCard", () => {
  beforeEach(() => {
    mockDownload.mockClear();
  });

  test("renders summary tables and wires download button", () => {
    render(<ExcelVisualizationCard data={buildData()} />);

    expect(screen.getByText(/Visualisasi Excel/i)).toBeInTheDocument();
    expect(screen.getByText(/Ringkasan Utama/)).toBeInTheDocument();
    expect(screen.getByText(/Tingkat Keparahan/)).toBeInTheDocument();
    expect(screen.getByText(/Portal B/)).toBeInTheDocument();

    const props = mockDownload.mock.calls[0][0];
    expect(props.filename).toBe("excel-visualization");
    expect(props.canDownload()).toBe(true);
    expect(props.canDownloadCsv()).toBe(true);
    expect(props.csvExporter()).toContain("Ringkasan");
    expect(props.getTarget()).toBeInstanceOf(HTMLDivElement);
  });

  test("shows empty-state text when no news data available", () => {
    const sparse = buildData({
      national_news_statistics: { top_national: [], all_national: [] },
      local_portal_statistics: { top_local: [], all_local: [] },
      healthcare_news_statistics: { top_healthcare: [], all_healthcare: [] },
    });
    render(<ExcelVisualizationCard data={sparse} />);
    expect(
      screen.getAllByText(/Tidak ada data berita yang tersedia/i).length
    ).toBeGreaterThan(0);
  });

  test("csv exporter escapes commas and quotes in cells", () => {
    const escaped = buildData({
      severity_statistics: {
        total_cases: 1,
        severity_counts: { 'Kritis, "A"': 1 },
      },
      national_news_statistics: {
        top_national: [],
        all_national: [{ portal: 'Portal, "Quoted"', news_count: 2, disease_count: 0 }],
      },
    });
    render(<ExcelVisualizationCard data={escaped} />);
    const props = mockDownload.mock.calls[0][0];
    const csv = props.csvExporter();
    expect(csv).toContain('"Kritis, ""A""",1');
    expect(csv).toContain('"Portal, ""Quoted""",2,0');
  });

  test("csv exporter quotes comma-containing cells without quotes", () => {
    render(
      <ExcelVisualizationCard
        data={buildData({
          severity_statistics: { total_cases: 1, severity_counts: { "Comma,Only": 2 } },
        })}
      />
    );
    const csv = mockDownload.mock.calls[0][0].csvExporter();
    expect(csv).toContain('"Comma,Only",2');
  });

  test("csv exporter skips empty news sections", () => {
    render(
      <ExcelVisualizationCard
        data={buildData({
          national_news_statistics: { top_national: [], all_national: [] },
          local_portal_statistics: { top_local: [], all_local: [] },
          healthcare_news_statistics: { top_healthcare: [], all_healthcare: [] },
        })}
      />
    );
    const csv = mockDownload.mock.calls[0][0].csvExporter();
    expect(csv).not.toContain("Sumber Berita");
    expect(mockDownload.mock.calls[0][0].canDownload()).toBe(true);
  });
});

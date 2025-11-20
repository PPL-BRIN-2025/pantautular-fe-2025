import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import SeverityChart, { DiseaseSeverityChart, ProvinceSeverityChart, CitySeverityChart } from "../../app/components/severity/Severity";
import { severityApi } from "../../services/api";

const canDownloadCalls: Array<boolean | undefined> = [];
jest.mock("../../app/components/dashboard/DownloadButton", () => ({
  __esModule: true,
  default: ({ canDownload }: { canDownload?: () => boolean }) => {
    const immediate = canDownload ? canDownload() : undefined;
    canDownloadCalls.length = 0;
    canDownloadCalls.push(immediate);

    return (
      <button
        type="button"
        aria-label="Download IMG"
        data-testid="download-btn"
        data-can-download={immediate}
      >
        Download IMG
      </button>
    );
  },
}));

// Mock the API calls
jest.mock("../../services/api", () => ({
  severityApi: {
    getDiseaseSeverityStats: jest.fn(),
    getProvinceSeverityStats: jest.fn(),
    getCitySeverityStats: jest.fn(),
  },
}));

// Mock amcharts
jest.mock("@amcharts/amcharts5", () => {
  const mockRoot = {
    container: {
      children: {
        push: jest.fn().mockReturnValue({
          setAll: jest.fn(),
          data: { setAll: jest.fn() },
          set: jest.fn(),
          xAxes: { push: jest.fn().mockReturnValue({
            get: (key: string) => {
              if (key === "renderer") {
                return {
                  setAll: jest.fn(),
                  grid: { template: { set: jest.fn() } },
                  labels: { template: { setAll: jest.fn() } }
                };
              }
              return {
                labels: { template: { setAll: jest.fn() } },
                grid: { template: { set: jest.fn() } }
              };
            },
            data: { setAll: jest.fn() }
          }) },
          yAxes: { push: jest.fn() },
          series: { push: jest.fn().mockReturnValue({
            columns: { template: { setAll: jest.fn(), adapters: { add: jest.fn() }, states: { create: jest.fn() } } },
            set: jest.fn(),
            data: { setAll: jest.fn() },
            get: (key: string) => {
              if (key === "tooltip") {
                return {
                  label: { setAll: jest.fn() }
                };
              }
              return {};
            }
          }) },
        }),
      },
    },
    dispose: jest.fn(),
  };

  return {
    Root: {
      new: jest.fn().mockReturnValue(mockRoot),
    },
    percent: jest.fn(),
    color: jest.fn(),
    Tooltip: {
      new: jest.fn().mockReturnValue({
        label: { setAll: jest.fn() },
      }),
    },
    RoundedRectangle: {
      new: jest.fn(),
    },
  };
});

jest.mock("@amcharts/amcharts5/xy", () => ({
  XYChart: {
    new: jest.fn().mockReturnValue({
      xAxes: { push: jest.fn() },
      yAxes: { push: jest.fn() },
      series: { push: jest.fn() },
    }),
  },
  CategoryAxis: {
    new: jest.fn().mockReturnValue({
      data: { setAll: jest.fn() },
      get: (key: string) => {
        if (key === "renderer") {
          return {
            labels: { template: { setAll: jest.fn() } },
            grid: { template: { set: jest.fn() } },
            setAll: jest.fn(),
            template: { set: jest.fn() }
          };
        }
        return null;
      },
    }),
  },
  ValueAxis: {
    new: jest.fn(),
  },
  ColumnSeries: {
    new: jest.fn().mockReturnValue({
      columns: { template: { setAll: jest.fn(), states: { create: jest.fn() } } },
      set: jest.fn(),
      data: { setAll: jest.fn() },
    }),
  },
  AxisRendererX: {
    new: jest.fn(),
  },
  AxisRendererY: {
    new: jest.fn(),
  },
}));

describe("Severity Charts", () => {
  const mockData = [
    {
      name: "Test Disease",
      hospitalisasi: 100,
      insiden: 200,
      mortalitas: 50,
      total_cases: 350,
    },
  ];

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    canDownloadCalls.length = 0;
    
    // Setup default mock responses
    (severityApi.getDiseaseSeverityStats as jest.Mock).mockResolvedValue(mockData);
    (severityApi.getProvinceSeverityStats as jest.Mock).mockResolvedValue(mockData);
    (severityApi.getCitySeverityStats as jest.Mock).mockResolvedValue(mockData);
  });

  describe("DiseaseSeverityChart", () => {
    it("renders loading state initially", async () => {
      render(<DiseaseSeverityChart />);
      const loadingContainer = screen.getByText((_content, element) => {
        const className = typeof element?.getAttribute === "function" ? element.getAttribute("class") ?? "" : "";
        return className.includes("animate-spin");
      });
      expect(loadingContainer).toHaveClass("animate-spin", "rounded-full", "h-8", "w-8", "border-b-2", "border-gray-900");
      await waitFor(() => expect(severityApi.getDiseaseSeverityStats).toHaveBeenCalled());
    });

    it("renders chart title and legend items", async () => {
      render(<DiseaseSeverityChart />);
      
      await waitFor(() => {
        expect(screen.getByText("Kasus Jenis Penyakit")).toBeInTheDocument();
        expect(screen.getByText("Hospitalisasi")).toBeInTheDocument();
        expect(screen.getByText("Insiden")).toBeInTheDocument();
        expect(screen.getByText("Mortalitas")).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /download img/i })).toBeInTheDocument();
      });
    });

    it("handles API error gracefully", async () => {
      (severityApi.getDiseaseSeverityStats as jest.Mock).mockRejectedValue(new Error("API Error"));
      
      render(<DiseaseSeverityChart />);
      
      await waitFor(() => {
        expect(screen.getByText(/Error:/)).toBeInTheDocument();
      });
    });
  });

  describe("ProvinceSeverityChart", () => {
    it("renders loading state initially", async () => {
      render(<ProvinceSeverityChart />);
      const loadingContainer = screen.getByText((_content, element) => {
        const className = typeof element?.getAttribute === "function" ? element.getAttribute("class") ?? "" : "";
        return className.includes("animate-spin");
      });
      expect(loadingContainer).toHaveClass("animate-spin", "rounded-full", "h-8", "w-8", "border-b-2", "border-gray-900");
      await waitFor(() => expect(severityApi.getProvinceSeverityStats).toHaveBeenCalled());
    });

    it("renders chart title and legend items", async () => {
      render(<ProvinceSeverityChart />);
      
      await waitFor(() => {
        expect(screen.getByText("Kasus Jangkauan Provinsi")).toBeInTheDocument();
        expect(screen.getByText("Hospitalisasi")).toBeInTheDocument();
        expect(screen.getByText("Insiden")).toBeInTheDocument();
        expect(screen.getByText("Mortalitas")).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /download img/i })).toBeInTheDocument();
      });
    });

    it("handles API error gracefully", async () => {
      (severityApi.getProvinceSeverityStats as jest.Mock).mockRejectedValue(new Error("API Error"));
      
      render(<ProvinceSeverityChart />);
      
      await waitFor(() => {
        expect(screen.getByText(/Error:/)).toBeInTheDocument();
      });
    });
  });

  describe("CitySeverityChart", () => {
    it("renders loading state initially", async () => {
      render(<CitySeverityChart />);
      const loadingContainer = screen.getByText((_content, element) => {
        const className = typeof element?.getAttribute === "function" ? element.getAttribute("class") ?? "" : "";
        return className.includes("animate-spin");
      });
      expect(loadingContainer).toHaveClass("animate-spin", "rounded-full", "h-8", "w-8", "border-b-2", "border-gray-900");
      await waitFor(() => expect(severityApi.getCitySeverityStats).toHaveBeenCalled());
    });

    it("renders chart title and legend items", async () => {
      render(<CitySeverityChart />);
      
      await waitFor(() => {
        expect(screen.getByText("Kasus Jangkauan Kota")).toBeInTheDocument();
        expect(screen.getByText("Hospitalisasi")).toBeInTheDocument();
        expect(screen.getByText("Insiden")).toBeInTheDocument();
        expect(screen.getByText("Mortalitas")).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /download img/i })).toBeInTheDocument();
      });
    });

    it("handles API error gracefully", async () => {
      (severityApi.getCitySeverityStats as jest.Mock).mockRejectedValue(new Error("API Error"));
      
      render(<CitySeverityChart />);
      
      await waitFor(() => {
        expect(screen.getByText(/Error:/)).toBeInTheDocument();
      });
    });
  });

  it("shows 'No data available' when API returns empty array", async () => {
    (severityApi.getDiseaseSeverityStats as jest.Mock).mockResolvedValue([]);
    
    render(<DiseaseSeverityChart />);
    
    await waitFor(() => {
      expect(screen.getByText("No data available")).toBeInTheDocument();
    });
  });

  it("transforms filtered responses for province type", async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      disease_stats: [],
      province_stats: [
        {
          name: "West Java",
          severity_counts: { hospitalisasi: 1, insiden: 2, mortalitas: 3 },
          total_cases: 6,
        },
      ],
      city_stats: [],
    });

    render(
      <SeverityChart
        title="Provincial Severity"
        categoryField="name"
        fetchData={fetchMock}
        seriesConfig={[
          { field: "hospitalisasi", name: "Hosp", color: "#000" },
          { field: "insiden", name: "Inc", color: "#111" },
        ]}
        filter={{} as any}
        type="province"
      />
    );

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    await waitFor(() =>
      expect(
        document.querySelector('[id^="chartdiv-"]')
      ).toBeInTheDocument()
    );
  });

  it("maps city stats when filter response is provided", async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      disease_stats: [],
      province_stats: [],
      city_stats: [
        {
          name: "Jakarta",
          severity_counts: { hospitalisasi: 2, insiden: 3, mortalitas: 4 },
          total_cases: 9,
        },
      ],
    });

    render(
      <SeverityChart
        title="City Severity"
        categoryField="name"
        fetchData={fetchMock}
        seriesConfig={[
          { field: "hospitalisasi", name: "Hosp", color: "#123" },
          { field: "insiden", name: "Inc", color: "#456" },
        ]}
        filter={{} as any}
        type="city"
      />
    );

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    await waitFor(() => expect(canDownloadCalls[0]).toBe(true));
  });

  it("disables download when city stats are empty totals", async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      disease_stats: [],
      province_stats: [],
      city_stats: [
        {
          name: "Empty City",
          severity_counts: { hospitalisasi: 0, insiden: 0, mortalitas: 0 },
          total_cases: 0,
        },
      ],
    });

    render(
      <SeverityChart
        title="City Severity"
        categoryField="name"
        fetchData={fetchMock}
        seriesConfig={[
          { field: "hospitalisasi", name: "Hosp", color: "#123" },
          { field: "insiden", name: "Inc", color: "#456" },
        ]}
        filter={{} as any}
        type="city"
      />
    );

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    await waitFor(() => expect(canDownloadCalls[0]).toBe(false));
  });
});

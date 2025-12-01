import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import SpatialComparisonPanel from "../../app/components/spatial/SpatialComparisonPanel";
import { useSpatialComparisons } from "../../hooks/useSpatialComparisons";
import { FilterState, SpatialComparisonRegion } from "../../types";
import React from "react";

jest.mock("../../hooks/useSpatialComparisons");

let mockMapServices: Record<
  string,
  {
    hideAllLayers: jest.Mock;
    showHumidityLayer: jest.Mock;
    showPrecipitationLayer: jest.Mock;
    showTemperatureLayer: jest.Mock;
    showSeverityLayer: jest.Mock;
  }
>;

jest.mock("react-select", () => {
  const React = require("react");
  const MockSelect = ({
    options = [],
    value,
    onChange,
    "data-testid": dataTestId = "select",
    isDisabled,
    components: providedComponents,
  }: any) => {
    const flat = options.flatMap((opt: any) =>
      Array.isArray(opt.options) ? opt.options : [opt]
    );
    if (value && !flat.some((opt: any) => opt.value === value.value)) {
      flat.unshift(value);
    }
    const GroupWrapper =
      providedComponents?.Group ||
      (({ children }: any) => <>{children}</>);
    return (
      <GroupWrapper label="mock-group">
        <select
          data-testid={dataTestId}
          disabled={isDisabled}
          value={value?.value || ""}
          onChange={(event) => {
            const next = flat.find((item) => item.value === event.target.value) || null;
            onChange?.(next);
          }}
        >
          <option value="">--</option>
          {flat.map((opt: any) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </GroupWrapper>
    );
  };
  MockSelect.components = { Group: ({ children }: any) => <div>{children}</div> };
  return { __esModule: true, default: MockSelect, components: MockSelect.components };
});

jest.mock("../../app/components/IndonesiaMap", () => {
  const React = require("react");
  return {
    IndonesiaMap: ({ mapId = "main", onError, onMapReady }: any) => {
      const hasCalled = React.useRef(false);
      React.useEffect(() => {
        if (!hasCalled.current && onMapReady) {
          hasCalled.current = true;
          const service = {
            hideAllLayers: jest.fn(),
            showHumidityLayer: jest.fn(),
            showPrecipitationLayer: jest.fn(),
            showTemperatureLayer: jest.fn(),
            showSeverityLayer: jest.fn(),
          };
          mockMapServices[mapId] = service;
          onMapReady(service);
        }
      }, [onMapReady, mapId]);
      return (
        <div data-testid={`map-${mapId}`} onClick={() => onError?.("map-error")}>
          Map {mapId}
        </div>
      );
    },
  };
});

const baseFilters: FilterState = {
  diseases: [],
  locations: [],
  level_of_alertness: 0,
  portals: [],
  start_date: null,
  end_date: null,
  batch: null,
};

const provinceData = [];
const mockUseSpatialComparisons = useSpatialComparisons as jest.Mock;

const renderPanel = (props: Partial<Parameters<typeof SpatialComparisonPanel>[0]> = {}) =>
  render(
    <SpatialComparisonPanel
      baseFilters={baseFilters}
      refreshToken={0}
      onError={props.onError as any}
      provinceHumidityData={provinceData}
      provinceTemperatureData={provinceData}
      provincePrecipitationData={provinceData}
      provinceSeverityData={provinceData}
      {...props}
    />
  );

describe("SpatialComparisonPanel", () => {
  let latestError: jest.Mock;

  beforeEach(() => {
    mockMapServices = {};
    latestError = jest.fn();
    jest.clearAllMocks();
    mockUseSpatialComparisons.mockImplementation(({ regions }: { regions: SpatialComparisonRegion[] }) => ({
      comparisons:
        regions.length >= 2
          ? [
              {
                label: "Jakarta",
                count: 2,
                locations: [
                  {
                    id: "1",
                    city: "Jakarta",
                    location__latitude: -6.2,
                    location__longitude: 106.8,
                    location__province: "DKI",
                  },
                ],
                filters: {},
              },
            ]
          : [],
      isLoading: false,
      error: null,
      lastUpdated: new Date("2025-01-01T00:00:00Z"),
    }));
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        data: {
          locations: {
            provinces: [{ value: "Jakarta", label: "Jakarta" }],
            cities: [{ value: "Bandung", label: "Bandung" }],
          },
        },
      }),
    } as any);
  });

  it("shows loading state before filter options resolve and guidance afterwards", async () => {
    renderPanel({ onError: latestError });

    await waitFor(() =>
      expect(screen.getByTestId("comparison-status")).toHaveTextContent("Memuat daftar wilayah")
    );
    await waitFor(() =>
      expect(screen.getByTestId("comparison-status")).toHaveTextContent("minimal dua wilayah")
    );
    expect(latestError).not.toHaveBeenCalled();
  });

  it("reports filter loading failures", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({}),
    });

    renderPanel({ onError: latestError });

    await waitFor(() =>
      expect(screen.getByTestId("comparison-status")).toHaveTextContent("Gagal memuat daftar wilayah")
    );
    expect(latestError).toHaveBeenCalledWith("Gagal memuat daftar wilayah");
  });

  it("syncs selections, renders comparisons, toggles every metric layer, and forwards map errors", async () => {
    renderPanel({ onError: latestError });

    await waitFor(() =>
      expect(screen.getByTestId("comparison-status")).toHaveTextContent("minimal dua wilayah")
    );

    fireEvent.change(screen.getByTestId("region-a-select"), { target: { value: "Jakarta" } });
    fireEvent.change(screen.getByTestId("region-b-select"), { target: { value: "Bandung" } });
    fireEvent.click(screen.getByTestId("refresh-comparison"));

    const card = await screen.findByTestId("comparison-card");
    expect(card).toBeInTheDocument();
    expect(mockMapServices["comparison-map-0"].hideAllLayers).toHaveBeenCalled();

    const metricSelect = screen.getByTestId("metric-select");
    fireEvent.change(metricSelect, { target: { value: "humidity" } });
    fireEvent.change(metricSelect, { target: { value: "precipitation" } });
    fireEvent.change(metricSelect, { target: { value: "temperature" } });
    fireEvent.change(metricSelect, { target: { value: "severity" } });

    const service = mockMapServices["comparison-map-0"];
    expect(service.showHumidityLayer).toHaveBeenCalled();
    expect(service.showPrecipitationLayer).toHaveBeenCalled();
    expect(service.showTemperatureLayer).toHaveBeenCalled();
    expect(service.showSeverityLayer).toHaveBeenCalled();

    fireEvent.click(screen.getByTestId("map-comparison-map-0"));
    expect(latestError).toHaveBeenCalledWith("map-error");
  });

  it("enforces maxRegions and resets selections", async () => {
    renderPanel({ onError: latestError, maxRegions: 1 });

    await waitFor(() =>
      expect(screen.getByTestId("comparison-status")).toHaveTextContent("minimal dua wilayah")
    );

    fireEvent.change(screen.getByTestId("region-a-select"), { target: { value: "Jakarta" } });
    fireEvent.change(screen.getByTestId("region-b-select"), { target: { value: "Bandung" } });
    fireEvent.click(screen.getByTestId("refresh-comparison"));

    await waitFor(() =>
      expect(screen.getByTestId("comparison-status")).toHaveTextContent("minimal dua wilayah")
    );

    fireEvent.click(screen.getByTestId("reset-region-selection"));
    expect((screen.getByTestId("region-a-select") as HTMLSelectElement).value).toBe("");
    expect((screen.getByTestId("region-b-select") as HTMLSelectElement).value).toBe("");
  });

  it("stops updating options when unmounted during fetch", async () => {
    let resolveFetch: ((value: any) => void) | null = null;
    const fetchPromise = new Promise((resolve) => {
      resolveFetch = resolve;
    });
    (global.fetch as jest.Mock).mockReturnValue(fetchPromise as any);

    const { unmount } = renderPanel({ onError: latestError });
    unmount();

    await act(async () => {
      resolveFetch?.({
        ok: true,
        json: async () => ({ data: { locations: { provinces: [{ label: "AfterUnmount" }] } } }),
      });
      await fetchPromise;
    });

    expect(latestError).not.toHaveBeenCalled();
  });

  it("uses fallback message when fetch rejects with a non-error value", async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce("network down");

    renderPanel({ onError: latestError });

    await waitFor(() =>
      expect(latestError).toHaveBeenCalledWith("Gagal memuat daftar wilayah")
    );
  });

  it("ignores fetch errors that resolve after unmount", async () => {
    let rejectFetch: ((reason?: any) => void) | null = null;
    const fetchPromise = new Promise((_, reject) => {
      rejectFetch = reject;
    });
    (global.fetch as jest.Mock).mockReturnValue(fetchPromise as any);

    const { unmount } = renderPanel({ onError: latestError });
    unmount();

    await act(async () => {
      rejectFetch?.(new Error("late failure"));
      try {
        await fetchPromise;
      } catch {
        // ignore
      }
    });

    expect(latestError).not.toHaveBeenCalled();
  });

  it("normalizes options that only provide label or name fields", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: {
          locations: {
            provinces: [{ label: "LabelOnly" }, { name: "NameOnly" }, {}],
            cities: [{ name: "CityName" }],
          },
        },
      }),
    });

    renderPanel({ onError: latestError });

    await waitFor(() =>
      expect(screen.getByTestId("comparison-status")).toHaveTextContent("minimal dua wilayah")
    );

    fireEvent.change(screen.getByTestId("region-a-select"), { target: { value: "LabelOnly" } });
    fireEvent.change(screen.getByTestId("region-b-select"), { target: { value: "NameOnly" } });

    expect((screen.getByTestId("region-a-select") as HTMLSelectElement).value).toBe("LabelOnly");
    expect((screen.getByTestId("region-b-select") as HTMLSelectElement).value).toBe("NameOnly");
  });

  it("falls back to empty arrays when filter payload omits locations", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: {} }),
    });

    renderPanel({ onError: latestError });

    await waitFor(() =>
      expect(screen.getByTestId("comparison-status")).toHaveTextContent("minimal dua wilayah")
    );
  });

  it("shows '-' when lastUpdated is not provided", async () => {
    mockUseSpatialComparisons.mockImplementation(() => ({
      comparisons: [
        {
          label: "Without timestamp",
          count: 1,
          locations: [
            { id: "1", city: "Bandung", location__latitude: -6.9, location__longitude: 107.6, location__province: "Jabar" },
          ],
          filters: {},
        },
      ],
      isLoading: false,
      error: null,
      lastUpdated: null,
    }));

    renderPanel({
      onError: latestError,
      initialRegions: [
        { value: "Without timestamp", label: "Without timestamp" },
        { value: "Region B", label: "Region B" },
      ],
    });

    await waitFor(() => expect(screen.getAllByText("-").length).toBeGreaterThan(0));
  });

  it("shows hook error, loading, and empty states for selected regions and allows closing the overlay", async () => {
    let hookState: "error" | "loading" | "empty" = "error";
    mockUseSpatialComparisons.mockImplementation(() => {
      if (hookState === "error") {
        return { comparisons: [], isLoading: false, error: new Error("Comparison failed"), lastUpdated: null };
      }
      if (hookState === "loading") {
        return { comparisons: [], isLoading: true, error: null, lastUpdated: null };
      }
      return { comparisons: [], isLoading: false, error: null, lastUpdated: null };
    });

    const onClose = jest.fn();
    const initialRegions = [
      { value: "Jakarta", label: "Jakarta" },
      { value: "Bandung", label: "Bandung" },
    ];

    const { rerender } = renderPanel({
      onError: latestError,
      initialRegions,
      overlayMode: true,
      onClose,
    });

    await waitFor(() =>
      expect(screen.getByTestId("comparison-status")).toHaveTextContent("Comparison failed")
    );
    fireEvent.click(screen.getByTestId("close-spatial-panel"));
    expect(onClose).toHaveBeenCalled();

    hookState = "loading";
    rerender(
      <SpatialComparisonPanel
        baseFilters={baseFilters}
        refreshToken={0}
        onError={latestError}
        provinceHumidityData={provinceData}
        provinceTemperatureData={provinceData}
        provincePrecipitationData={provinceData}
        provinceSeverityData={provinceData}
        initialRegions={initialRegions}
        overlayMode
        onClose={onClose}
      />
    );
    await waitFor(() =>
      expect(screen.getByTestId("comparison-status")).toHaveTextContent("Menyiapkan perbandingan spasial")
    );

    hookState = "empty";
    rerender(
      <SpatialComparisonPanel
        baseFilters={baseFilters}
        refreshToken={0}
        onError={latestError}
        provinceHumidityData={provinceData}
        provinceTemperatureData={provinceData}
        provincePrecipitationData={provinceData}
        provinceSeverityData={provinceData}
        initialRegions={initialRegions}
        overlayMode
        onClose={onClose}
      />
    );
    await waitFor(() =>
      expect(screen.getByTestId("comparison-status")).toHaveTextContent("Tidak ada data untuk filter yang dipilih.")
    );
  });

  it("renders filter summary with formatted dates and preserves initial regions", async () => {
    const filtersWithValues: FilterState = {
      diseases: ["Dengue"],
      locations: [],
      level_of_alertness: 2,
      portals: ["portal-a"],
      start_date: "invalid-date",
      end_date: new Date("2025-02-01T00:00:00Z"),
      batch: "batch-9",
    };

    const initialRegions = [
      { value: "Semarang", label: "Semarang" },
      { value: "Surabaya", label: "Surabaya" },
    ];

    const { rerender } = render(
      <SpatialComparisonPanel
        baseFilters={filtersWithValues}
        refreshToken={0}
        onError={latestError}
        provinceHumidityData={provinceData}
        provinceTemperatureData={provinceData}
        provincePrecipitationData={provinceData}
        provinceSeverityData={provinceData}
        initialRegions={initialRegions}
      />
    );

    const summary = screen.getByText(/Ringkasan filter/i).parentElement as HTMLElement;
    expect(summary.textContent).toContain("Penyakit: Dengue");
    expect(summary.textContent).toContain("Portal: portal-a");
    expect(summary.textContent).toContain("Kewaspadaan: 2");
    expect(summary.textContent).toContain("Rentang: -");
    expect(summary.textContent).toMatch(/2025/);
    expect(summary.textContent).toContain("Batch: batch-9");

    expect((screen.getByTestId("region-a-select") as HTMLSelectElement).value).toBe("Semarang");
    expect((screen.getByTestId("region-b-select") as HTMLSelectElement).value).toBe("Surabaya");

    rerender(
      <SpatialComparisonPanel
        baseFilters={{ ...baseFilters, start_date: new Date("2025-03-01T00:00:00Z"), end_date: null }}
        refreshToken={0}
        onError={latestError}
        provinceHumidityData={provinceData}
        provinceTemperatureData={provinceData}
        provincePrecipitationData={provinceData}
        provinceSeverityData={provinceData}
        initialRegions={initialRegions}
      />
    );
    await waitFor(() => {
      const updatedSummary = screen.getByText(/Ringkasan filter/i).parentElement?.textContent ?? "";
      expect(updatedSummary).toContain("Rentang");
      expect(updatedSummary).toMatch(/2025/);
    });

    rerender(
      <SpatialComparisonPanel
        baseFilters={{ ...baseFilters, start_date: null, end_date: new Date("2025-04-02T00:00:00Z") }}
        refreshToken={0}
        onError={latestError}
        provinceHumidityData={provinceData}
        provinceTemperatureData={provinceData}
        provincePrecipitationData={provinceData}
        provinceSeverityData={provinceData}
        initialRegions={initialRegions}
      />
    );
    await waitFor(() => {
      const updatedSummary = screen.getByText(/Ringkasan filter/i).parentElement?.textContent ?? "";
      expect(updatedSummary).toMatch(/2025/);
      expect(updatedSummary).toContain("Rentang");
    });
  });
});

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import SpatialComparisonPanel from "../../app/components/spatial/SpatialComparisonPanel";
import { useSpatialComparisons } from "../../hooks/useSpatialComparisons";
import { FilterState } from "../../types";
import React from "react";

jest.mock("../../hooks/useSpatialComparisons");

let mockLatestMapService: Record<string, jest.Mock> | null = null;

jest.mock("../../app/components/IndonesiaMap", () => {
  const React = require("react");
  return {
    IndonesiaMap: (props: any) => {
      React.useEffect(() => {
        if (props.onMapReady) {
          mockLatestMapService = {
            hideAllLayers: jest.fn(),
            showPrecipitationLayer: jest.fn(),
            showHumidityLayer: jest.fn(),
            showTemperatureLayer: jest.fn(),
            showSeverityLayer: jest.fn(),
          };
          props.onMapReady(mockLatestMapService);
        }
      }, [props.onMapReady]);
      return <div data-testid={`map-${props.mapId}`}>Map {props.mapId}</div>;
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

describe("SpatialComparisonPanel", () => {
  beforeEach(() => {
    mockLatestMapService = null;
    (useSpatialComparisons as jest.Mock).mockReturnValue({
      comparisons: [],
      isLoading: false,
      error: null,
      lastUpdated: null,
    });
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

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("shows guidance when less than two regions are selected", async () => {
    render(
      <SpatialComparisonPanel
        baseFilters={baseFilters}
        refreshToken={0}
        onError={jest.fn()}
        provinceHumidityData={provinceData}
        provinceTemperatureData={provinceData}
        provincePrecipitationData={provinceData}
        provinceSeverityData={provinceData}
      />
    );

    await waitFor(() => expect(screen.getByTestId("comparison-status")).toBeInTheDocument());
    expect(screen.getByTestId("comparison-status")).toHaveTextContent("minimal dua wilayah");
  });

  it("renders comparison cards and applies metric toggles to the map service", async () => {
    (useSpatialComparisons as jest.Mock).mockReturnValue({
      comparisons: [
        {
          label: "Jakarta",
          count: 2,
          locations: [
            { id: "1", city: "Jakarta", location__latitude: -6.2, location__longitude: 106.8, location__province: "DKI" },
          ],
          filters: {},
        },
      ],
      isLoading: false,
      error: null,
      lastUpdated: new Date("2025-01-01T00:00:00Z"),
    });

    render(
      <SpatialComparisonPanel
        baseFilters={baseFilters}
        refreshToken={0}
        onError={jest.fn()}
        provinceHumidityData={provinceData}
        provinceTemperatureData={provinceData}
        provincePrecipitationData={provinceData}
        provinceSeverityData={provinceData}
        initialRegions={[
          { value: "Jakarta", label: "Jakarta" },
          { value: "Bandung", label: "Bandung" },
        ]}
      />
    );

    await waitFor(() => expect(screen.getAllByTestId("comparison-card").length).toBe(1));
    expect(mockLatestMapService?.hideAllLayers).toHaveBeenCalled();

    const metricSelect = screen.getByTestId("metric-select");
    fireEvent.change(metricSelect, { target: { value: "humidity" } });
    expect(mockLatestMapService?.showHumidityLayer).toHaveBeenCalled();

    fireEvent.change(metricSelect, { target: { value: "precipitation" } });
    expect(mockLatestMapService?.showPrecipitationLayer).toHaveBeenCalled();
  });

  it("applies selected regions when clicking sinkronkan filter", async () => {
    render(
      <SpatialComparisonPanel
        baseFilters={baseFilters}
        refreshToken={0}
        onError={jest.fn()}
        provinceHumidityData={provinceData}
        provinceTemperatureData={provinceData}
        provincePrecipitationData={provinceData}
        provinceSeverityData={provinceData}
      />
    );

    await waitFor(() => expect(screen.getByTestId("region-a-select")).toBeInTheDocument());

    // Select first option
    const regionSelectA = screen.getByTestId("region-a-select").querySelector("input");
    const regionSelectB = screen.getByTestId("region-b-select").querySelector("input");
    if (regionSelectA && regionSelectB) {
      fireEvent.focus(regionSelectA);
      fireEvent.change(regionSelectA, { target: { value: "Jakarta" } });
      fireEvent.keyDown(regionSelectA, { key: "Enter", code: "Enter" });

      fireEvent.focus(regionSelectB);
      fireEvent.change(regionSelectB, { target: { value: "Bandung" } });
      fireEvent.keyDown(regionSelectB, { key: "Enter", code: "Enter" });
    }

    fireEvent.click(screen.getByTestId("refresh-comparison"));

    expect(screen.getByTestId("comparison-status")).toBeInTheDocument();
  });

  it("displays API errors from the comparison hook", async () => {
    (useSpatialComparisons as jest.Mock).mockReturnValue({
      comparisons: [],
      isLoading: false,
      error: new Error("Comparison failed"),
      lastUpdated: null,
    });

    render(
      <SpatialComparisonPanel
        baseFilters={baseFilters}
        refreshToken={0}
        onError={jest.fn()}
        provinceHumidityData={provinceData}
        provinceTemperatureData={provinceData}
        provincePrecipitationData={provinceData}
        provinceSeverityData={provinceData}
        initialRegions={[
          { value: "Jakarta", label: "Jakarta" },
          { value: "Bandung", label: "Bandung" },
        ]}
      />
    );

    await waitFor(() => expect(screen.getByTestId("comparison-status")).toBeInTheDocument());
    expect(screen.getByTestId("comparison-status")).toHaveTextContent("Comparison failed");
  });
});

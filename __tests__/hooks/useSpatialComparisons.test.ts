import { renderHook, waitFor } from "@testing-library/react";
import { useSpatialComparisons } from "../../hooks/useSpatialComparisons";
import { mapApi } from "../../services/api";
import { FilterState, SpatialComparisonRegion } from "../../types";

jest.mock("../../services/api", () => ({
  mapApi: {
    getSpatialComparisons: jest.fn(),
  },
}));

const baseFilters: FilterState = {
  diseases: [],
  locations: [],
  level_of_alertness: 0,
  portals: [],
  start_date: null,
  end_date: null,
  batch: null,
};

const sampleRegions: SpatialComparisonRegion[] = [
  { value: "Jakarta", label: "Jakarta" },
  { value: "Bandung", label: "Bandung" },
];

describe("useSpatialComparisons", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("fetches comparisons when enabled and regions are provided", async () => {
    const mockResponse = {
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
    };

    (mapApi.getSpatialComparisons as jest.Mock).mockResolvedValueOnce(mockResponse);

    const { result } = renderHook(() =>
      useSpatialComparisons({
        regions: sampleRegions,
        baseFilters,
        enabled: true,
        refreshToken: 0,
      })
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.comparisons).toEqual(mockResponse.comparisons);
    expect(result.current.error).toBeNull();
    expect(result.current.lastUpdated).not.toBeNull();
    expect(mapApi.getSpatialComparisons).toHaveBeenCalledTimes(1);
    expect(mapApi.getSpatialComparisons).toHaveBeenCalledWith({
      regions: expect.any(Array),
    });
  });

  it("skips fetching when disabled or fewer than two regions", async () => {
    const { result } = renderHook(() =>
      useSpatialComparisons({
        regions: [],
        baseFilters,
        enabled: false,
        refreshToken: 0,
      })
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.comparisons).toEqual([]);
    expect(mapApi.getSpatialComparisons).not.toHaveBeenCalled();
  });

  it("handles errors from API", async () => {
    (mapApi.getSpatialComparisons as jest.Mock).mockRejectedValueOnce(new Error("API failed"));

    const { result } = renderHook(() =>
      useSpatialComparisons({
        regions: sampleRegions,
        baseFilters,
        enabled: true,
        refreshToken: 0,
      })
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.error).toEqual(new Error("API failed"));
    expect(result.current.comparisons).toEqual([]);
  });

  it("refetches when refreshToken changes even if filters stay the same", async () => {
    const firstResponse = { comparisons: [], lastUpdated: null };
    const secondResponse = { comparisons: [{ label: "Bandung", count: 1, locations: [], filters: {} }] };
    (mapApi.getSpatialComparisons as jest.Mock)
      .mockResolvedValueOnce(firstResponse)
      .mockResolvedValueOnce(secondResponse);

    const { result, rerender } = renderHook(
      (props: { refreshToken: number }) =>
        useSpatialComparisons({
          regions: sampleRegions,
          baseFilters,
          enabled: true,
          refreshToken: props.refreshToken,
        }),
      { initialProps: { refreshToken: 0 } }
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(mapApi.getSpatialComparisons).toHaveBeenCalledTimes(1);

    rerender({ refreshToken: 1 });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(mapApi.getSpatialComparisons).toHaveBeenCalledTimes(2);
    expect(result.current.comparisons).toEqual(secondResponse.comparisons);
  });
});

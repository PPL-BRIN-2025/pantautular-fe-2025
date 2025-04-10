import { renderHook, waitFor } from "@testing-library/react";
import { useDashboardData } from "../../hooks/useDashboardData";
import { mapApi } from "../../services/api";

jest.mock("../../services/api");

describe("useDashboardData", () => {
  it("fetches and returns dashboard data successfully", async () => {
    const mockData = {
      severity_statistics: { total_cases: 100 },
      prevalence_statistics: { prevalence: 0.07315 },
      gender_statistics: { male: 50, female: 50 },
    };
    (mapApi.getDashboardData as jest.Mock).mockResolvedValueOnce(mockData);

    const { result } = renderHook(() => useDashboardData());

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.data).toEqual(mockData);
    expect(result.current.error).toBeNull();
  });

  it("handles API errors correctly", async () => {
    const mockError = new Error("Failed to fetch");
    (mapApi.getDashboardData as jest.Mock).mockRejectedValueOnce(mockError);

    const { result } = renderHook(() => useDashboardData());

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.data).toBeNull();
    expect(result.current.error).toBe("Failed to fetch dashboard data");
  });
});
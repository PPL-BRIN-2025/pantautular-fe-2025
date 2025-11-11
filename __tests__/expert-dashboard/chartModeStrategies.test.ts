import {
  getChartModeStrategy,
} from "../../app/expert-dashboard/chartModeStrategies";

describe("chartModeStrategies", () => {
  test("returns concrete strategy for each known mode", () => {
    const trend = getChartModeStrategy("trend");
    expect(trend.title).toContain("Trend Mode");
    expect(trend.buildPoints()).toHaveLength(5);

    const raw = getChartModeStrategy("raw_chart");
    expect(raw.title).toContain("Raw Chart");
    const points = raw.buildPoints();
    expect(points[3].label).toBe("Kamis");
    expect(points[4].reference).toBe(0);
  });

  test("falls back to trend strategy when mode is unknown", () => {
    const fallback = getChartModeStrategy("unknown" as any);
    expect(fallback.title).toContain("Trend Mode");
  });
});

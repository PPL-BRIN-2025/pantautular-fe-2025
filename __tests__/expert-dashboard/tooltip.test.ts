import {
  coerceNumber,
  coerceOptionalNumber,
  computeDelta,
  expertDashboardFlags,
  formatNumber,
  formatPercent,
  formatTimestamp,
  formatTooltipLines,
  formatPercentSuffix,
  mapToTooltipDatum,
} from "../../app/expert-dashboard/tooltip";

describe("expert-dashboard tooltip helpers", () => {
  afterEach(() => {
    expertDashboardFlags.showReferenceDelta = true;
  });

  it("computes positive delta with percentage", () => {
    const result = computeDelta(120, 100);
    expect(result).toEqual({ delta: 20, pct: 20 });
  });

  it("computes negative delta with percentage", () => {
    const result = computeDelta(80, 100);
    expect(result).toEqual({ delta: -20, pct: -20 });
  });

  it("returns null percentage when reference is zero", () => {
    const result = computeDelta(50, 0);
    expect(result).toEqual({ delta: 50, pct: null });
  });

  it("returns null delta when reference missing", () => {
    const result = computeDelta(50, undefined);
    expect(result).toEqual({ delta: null, pct: null });
  });

  it("maps raw datum fields to TooltipDatum structure", () => {
    const raw = {
      count: "42",
      previous: 40,
      name: "Hospitalisasi",
      period: "2024-W01",
    };

    const datum = mapToTooltipDatum(raw);
    expect(datum).toEqual({
      value: 42,
      reference: 40,
      label: "Hospitalisasi",
      timestamp: "2024-W01",
    });
  });

  it("coerces invalid numeric inputs to zero or null", () => {
    const datum = mapToTooltipDatum({
      count: "invalid",
      previous: "oops",
      name: "Kasus",
    });

    expect(datum.value).toBe(0);
    expect(datum.reference).toBeNull();
  });

  it("formats tooltip lines with value, reference, delta and percent", () => {
    const lines = formatTooltipLines({
      value: 120,
      reference: 100,
      label: "Kasus",
    });
    expect(lines).toEqual([
      "Kasus",
      "Value: 120",
      "Reference: 100",
      "Change: +20 (+20%)",
    ]);
  });

  it("omits percentage when reference is zero", () => {
    const lines = formatTooltipLines({
      value: 45,
      reference: 0,
      label: "Kasus",
    });
    expect(lines).toEqual([
      "Kasus",
      "Value: 45",
      "Reference: 0",
      "Change: +45",
    ]);
  });

  it("skips change lines when reference absent", () => {
    const lines = formatTooltipLines({
      value: 75,
      label: "Kasus",
    });
    expect(lines).toEqual(["Kasus", "Value: 75"]);
  });

  it("omits change block entirely when reference is undefined", () => {
    const lines = formatTooltipLines({
      value: 5,
    });
    expect(lines).toEqual(["Value: 5"]);
  });

  it("respects feature flag to hide delta", () => {
    expertDashboardFlags.showReferenceDelta = false;
    const lines = formatTooltipLines({
      value: 60,
      reference: 50,
      label: "Kasus",
    });
    expect(lines).toEqual([
      "Kasus",
      "Value: 60",
      "Reference: 50",
    ]);
  });

  it("includes timestamp and handles neutral deltas", () => {
    const date = new Date("2025-01-01T00:00:00Z");
    const lines = formatTooltipLines({
      value: 30,
      reference: 30,
      label: "Kasus",
      timestamp: date,
    });

    expect(lines[1]).toBe(date.toISOString());
    expect(lines[3]).toBe("Reference: 30");
    expect(lines[4]).toBe("Change: 0 (0%)");
  });

  it("falls back to string timestamps when value is not a Date", () => {
    const lines = formatTooltipLines({
      value: 10,
      reference: null,
      label: "Kasus",
      timestamp: "2025-01-02",
    });

    expect(lines[1]).toBe("2025-01-02");
  });

  it("exposes helpers for coercion and formatting edge cases", () => {
    expect(coerceNumber({})).toBe(0);
    expect(coerceOptionalNumber(null)).toBeNull();
    expect(coerceOptionalNumber(undefined)).toBeUndefined();
    expect(coerceOptionalNumber("15")).toBe(15);
    expect(coerceOptionalNumber({})).toBeNull();
    expect(formatNumber(Number.POSITIVE_INFINITY)).toBe("0");
    expect(formatPercent(Number.NaN)).toBe("0");
    expect(formatTimestamp(1700000000)).toBe("1700000000");
    expect(formatPercentSuffix(null)).toBe("");
    expect(formatPercentSuffix(12)).toContain("12");
  });

  it("maps numeric labels and timestamps to strings", () => {
    const datum = mapToTooltipDatum({
      total: 9,
      previous: 7,
      label: 123,
      timestamp: 456,
    });

    expect(datum.label).toBe("123");
    expect(datum.timestamp).toBe(456);
  });

  it("drops blank labels and skips change lines when reference missing", () => {
    const lines = formatTooltipLines({
      value: 12,
      label: "   ",
    });

    expect(lines[0]).toBe("Value: 12");
    expect(lines).toHaveLength(1);
  });
});

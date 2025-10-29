import {
  computeDelta,
  expertDashboardFlags,
  formatTooltipLines,
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
});

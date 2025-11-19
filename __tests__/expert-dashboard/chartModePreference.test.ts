import {
  CHART_MODE_METADATA,
  CHART_MODE_STORAGE_KEY,
  ChartMode,
  DEFAULT_CHART_MODE,
  loadChartModePreference,
  saveChartModePreference,
} from "../../app/expert-dashboard/chartModePreference";

const createMockStorage = () => {
  const store = new Map<string, string>();
  return {
    getItem: jest.fn((key: string) => store.get(key) ?? null),
    setItem: jest.fn((key: string, value: string) => void store.set(key, value)),
    removeItem: jest.fn((key: string) => {
      store.delete(key);
    }),
    clear: jest.fn(() => {
      store.clear();
    }),
  };
};

describe("chartModePreference helpers", () => {
  beforeEach(() => {
    const storage = createMockStorage();
    Object.defineProperty(window, "localStorage", {
      value: storage,
      configurable: true,
    });
  });

  it.each(Object.keys(CHART_MODE_METADATA) as ChartMode[])(
    "loads stored value for mode %s",
    (mode) => {
      window.localStorage.setItem(CHART_MODE_STORAGE_KEY, mode);
      expect(loadChartModePreference()).toBe(mode);
    }
  );

  it("returns null when stored value is invalid", () => {
    window.localStorage.setItem(CHART_MODE_STORAGE_KEY, "invalid-mode");
    expect(loadChartModePreference()).toBeNull();
  });

  it("returns null when storage throws", () => {
    Object.defineProperty(window, "localStorage", {
      value: {
        getItem: jest.fn(() => {
          throw new Error("quota exceeded");
        }),
      },
      configurable: true,
    });

    expect(loadChartModePreference()).toBeNull();
  });

  it("persists the selected mode", () => {
    const mode: ChartMode = "grouped_totals";
    saveChartModePreference(mode);
    expect(window.localStorage.setItem).toHaveBeenCalledWith(
      CHART_MODE_STORAGE_KEY,
      mode
    );
  });

  it("swallows persistence errors", () => {
    Object.defineProperty(window, "localStorage", {
      value: {
        setItem: jest.fn(() => {
          throw new Error("blocked");
        }),
        getItem: jest.fn(() => DEFAULT_CHART_MODE),
      },
      configurable: true,
    });

    expect(() => saveChartModePreference("raw_chart")).not.toThrow();
  });

  it("returns null when window is undefined", () => {
    const originalWindow = global.window;
    // @ts-ignore
    delete (global as any).window;
    expect(loadChartModePreference()).toBeNull();
    (global as any).window = originalWindow;
  });

  it("skips saving preference when window is undefined", () => {
    const originalWindow = global.window;
    // @ts-ignore
    delete (global as any).window;
    expect(() => saveChartModePreference("trend")).not.toThrow();
    (global as any).window = originalWindow;
  });
});

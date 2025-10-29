import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ExpertDashboardPage from "../../app/expert-dashboard/ExpertDashboardPage";
import {
  CHART_MODE_METADATA,
  CHART_MODE_STORAGE_KEY,
  ChartMode,
} from "../../app/expert-dashboard/chartModePreference";

const createMockStorage = () => {
  const store = new Map<string, string>();
  return {
    getItem: jest.fn((key: string) => store.get(key) ?? null),
    setItem: jest.fn((key: string, value: string) => {
      store.set(key, value);
    }),
    removeItem: jest.fn(),
    clear: jest.fn(),
  };
};

describe("ExpertDashboardPage", () => {
  beforeEach(() => {
    const storage = createMockStorage();
    Object.defineProperty(window, "localStorage", {
      value: storage,
      configurable: true,
    });
  });

  it("shows trend mode by default", () => {
    render(<ExpertDashboardPage />);

    expect(
      screen.getByRole("heading", { name: "Visualization Mode" })
    ).toBeInTheDocument();
    const trendLabel = CHART_MODE_METADATA.trend.label;
    expect(
      screen.getByLabelText(trendLabel, { selector: "input[type='radio']" })
    ).toBeChecked();
    expect(
      screen.getByRole("heading", {
        name: "Trend Mode – Weekly Cases",
        level: 3,
      })
    ).toBeInTheDocument();
  });

  it("restores persisted mode on load", async () => {
    const storedMode: ChartMode = "grouped_totals";
    window.localStorage.setItem(CHART_MODE_STORAGE_KEY, storedMode);

    render(<ExpertDashboardPage />);

    await waitFor(() =>
      expect(
        screen.getByLabelText(CHART_MODE_METADATA[storedMode].label, {
          selector: "input[type='radio']",
        })
      ).toBeChecked()
    );

    expect(
      screen.getByText(CHART_MODE_METADATA[storedMode].description)
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        name: "Grouped Totals – Cases by Category",
        level: 3,
      })
    ).toBeInTheDocument();
  });

  it("persists mode changes", async () => {
    const user = userEvent.setup();

    render(<ExpertDashboardPage />);

    const groupedRadio = screen.getByLabelText(
      CHART_MODE_METADATA.grouped_totals.label,
      { selector: "input[type='radio']" }
    );

    await user.click(groupedRadio);

    expect(window.localStorage.setItem).toHaveBeenLastCalledWith(
      CHART_MODE_STORAGE_KEY,
      "grouped_totals"
    );
    expect(
      screen.getByRole("heading", {
        name: "Grouped Totals – Cases by Category",
        level: 3,
      })
    ).toBeInTheDocument();
  });
});

import { exportChartAndLog } from "../../curator-feature/export/exporter";

// Mock logs API
jest.mock("../../services/api", () => ({
  logsApi: {
    logDownload: jest.fn().mockResolvedValue({ ok: true }),
  },
}));

describe("exportChartAndLog utility", () => {
  const notify = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("fails when element is null", async () => {
    await expect(
      exportChartAndLog({
        element: null,
        chartType: "test",
        fileName: "file",
        hasData: true,
        notify,
      })
    ).rejects.toBeTruthy();
    expect(notify).toHaveBeenCalledWith("error", expect.stringMatching(/not found/i));
  });

  it("fails when chart has no data", async () => {
    const el = document.createElement("div");
    Object.defineProperty(el, "offsetWidth", { value: 100 });
    Object.defineProperty(el, "offsetHeight", { value: 100 });

    await expect(
      exportChartAndLog({
        element: el,
        chartType: "test",
        fileName: "file",
        hasData: false,
        notify,
      })
    ).rejects.toBeTruthy();
    expect(notify).toHaveBeenCalledWith("error", expect.stringMatching(/no data/i));
  });

  it("exports via canvas fallback and logs event on success", async () => {
    const el = document.createElement("div");
    // Make element considered visible
    Object.defineProperty(el, "offsetWidth", { value: 100 });
    Object.defineProperty(el, "offsetHeight", { value: 100 });

    const canvas = document.createElement("canvas");
    // Provide a fake toDataURL so JSDOM doesn't throw
    (canvas as any).toDataURL = jest.fn().mockReturnValue("data:image/png;base64,AAA");
    el.appendChild(canvas);

    const createEl = jest.spyOn(document, "createElement");

    await expect(
      exportChartAndLog({
        element: el,
        chartType: "bar",
        fileName: "chart_bar",
        imageType: "png",
        hasData: true,
        getRoot: () => null, // force fallback path
        username: "tester",
        notify,
      })
    ).resolves.toBeUndefined();

    // Anchor for download created
    expect(createEl).toHaveBeenCalledWith("a");
    // Success toast
    expect(notify).toHaveBeenCalledWith("success", expect.stringMatching(/downloaded/i));
    // Logged
    const { logsApi } = require("../../services/api");
    expect(logsApi.logDownload).toHaveBeenCalledWith(
      expect.objectContaining({ username: "tester", chartType: "bar", timestamp: expect.any(String) })
    );
  });
});


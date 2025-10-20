import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import DownloadButton from "../../app/components/dashboard/DownloadButton";

jest.mock("@/utils/exportAsImage", () => ({
  exportElementAsPng: jest.fn()
}));

const { exportElementAsPng } = jest.requireMock("@/utils/exportAsImage") as {
  exportElementAsPng: jest.Mock;
};

describe("DownloadButton", () => {
  let alertSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    alertSpy = jest.spyOn(window, "alert").mockImplementation(() => {});
  });

  afterEach(() => {
    alertSpy.mockRestore();
  });

  it("exports the provided element as PNG", async () => {
    const target = document.createElement("div");
    target.textContent = "Sample Element";
    document.body.appendChild(target);

    exportElementAsPng.mockResolvedValue("data:image/png;base64,AAA");
    const appendSpy = jest.spyOn(document.body, "appendChild");

    render(
      <DownloadButton
        filename="sample"
        getTarget={() => target}
        label="Unduh Sample"
        size="md"
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /unduh sample/i }));

    await waitFor(() => {
      expect(exportElementAsPng).toHaveBeenCalledWith(target);
    });

    const appendedAnchor = appendSpy.mock.calls
      .map(([node]) => node)
      .find((node) => node instanceof HTMLAnchorElement) as HTMLAnchorElement | undefined;

    expect(appendedAnchor).toBeDefined();
    expect(appendedAnchor?.download).toBe("sample.png");
    expect(appendedAnchor?.href).toBe("data:image/png;base64,AAA");

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith("Berhasil mengunduh visualisasi.");
    });

    appendSpy.mockRestore();
  });

  it("warns when no target element is provided", () => {
    const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});

    render(
      <DownloadButton
        filename="empty"
        getTarget={() => null}
        label="Unduh Kosong"
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /unduh kosong/i }));

    expect(exportElementAsPng).not.toHaveBeenCalled();
    expect(warnSpy).toHaveBeenCalled();
    expect(alertSpy).toHaveBeenCalledWith("Gagal mengunduh visualisasi.");

    warnSpy.mockRestore();
  });

  it("shows empty data message when canDownload returns false", () => {
    const target = document.createElement("div");

    render(
      <DownloadButton
        filename="empty"
        getTarget={() => target}
        canDownload={() => false}
        label="Unduh Kosong"
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /unduh kosong/i }));

    expect(exportElementAsPng).not.toHaveBeenCalled();
    expect(alertSpy).toHaveBeenCalledWith("Gagal mengunduh: data kosong.");
  });
});

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

const createObjectURLSpy = jest.fn(() => "blob:mock");
const revokeObjectURLSpy = jest.fn();
const anchorClickSpy = jest
  .spyOn(HTMLAnchorElement.prototype, "click")
  .mockImplementation(function noop() {
    // Prevent jsdom navigation warnings.
  });

beforeAll(() => {
  Object.defineProperty(window.URL, "createObjectURL", {
    configurable: true,
    writable: true,
    value: createObjectURLSpy
  });
  Object.defineProperty(window.URL, "revokeObjectURL", {
    configurable: true,
    writable: true,
    value: revokeObjectURLSpy
  });
});

afterAll(() => {
  anchorClickSpy.mockRestore();
});

describe("DownloadButton", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    createObjectURLSpy.mockClear();
    revokeObjectURLSpy.mockClear();
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
      expect(
        screen.getByText("Berhasil mengunduh gambar visualisasi.")
      ).toBeInTheDocument();
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
    expect(
      screen.getByText("Gagal mengunduh gambar visualisasi karena elemen visualisasi tidak ditemukan.")
    ).toBeInTheDocument();

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
    expect(
      screen.getByText("Gagal mengunduh gambar visualisasi karena data kosong.")
    ).toBeInTheDocument();
  });

  it("marks itself to be ignored during html2canvas capture when requested", () => {
    const target = document.createElement("div");

    render(
      <DownloadButton
        filename="sample"
        getTarget={() => target}
        label="Unduh"
        ignoreDuringCapture
      />
    );

    const wrapper = screen.getByRole("button", { name: /unduh/i }).parentElement;
    expect(wrapper).toHaveAttribute("data-html2canvas-ignore", "true");
  });

  it("downloads CSV content when exporter is provided", async () => {
    const target = document.createElement("div");
    const csvExporter = jest.fn().mockResolvedValue("col1,col2");
    const appendSpy = jest.spyOn(document.body, "appendChild");

    render(
      <DownloadButton
        filename="dataset"
        getTarget={() => target}
        csvExporter={csvExporter}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /download csv/i }));

    await waitFor(() => {
      expect(csvExporter).toHaveBeenCalled();
    });

    const appendedAnchor = appendSpy.mock.calls
      .map(([node]) => node)
      .find((node) => node instanceof HTMLAnchorElement) as HTMLAnchorElement | undefined;

    expect(appendedAnchor).toBeDefined();
    expect(appendedAnchor?.download).toBe("dataset.csv");
    expect(createObjectURLSpy).toHaveBeenCalled();

    await waitFor(() => {
      expect(
        screen.getByText("Berhasil mengunduh data dalam format CSV.")
      ).toBeInTheDocument();
    });

    appendSpy.mockRestore();
  });

  it("shows csv empty message when canDownloadCsv returns false", () => {
    const target = document.createElement("div");

    render(
      <DownloadButton
        filename="dataset"
        getTarget={() => target}
        csvExporter={() => "col"}
        canDownloadCsv={() => false}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /download csv/i }));

    expect(
      screen.getByText("Gagal mengunduh data CSV karena data kosong.")
    ).toBeInTheDocument();
  });
});

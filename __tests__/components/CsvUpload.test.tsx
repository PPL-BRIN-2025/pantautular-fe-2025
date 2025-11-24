import React from "react";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import CsvUpload from "../../app/components/CsvUpload";

jest.mock("../../app/components/AccessDenied", () => () => <div data-testid="access-denied" />);

const mockReplace = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mockReplace }),
}));

const originalFetch = global.fetch;

describe("CsvUpload", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global as any).fetch = jest.fn();
    (global as any).localStorage = {
      getItem: jest.fn().mockReturnValue(null),
    };
  });

  afterEach(() => {
    (global as any).fetch = originalFetch;
  });

  test("redirects when no user present", async () => {
    render(<CsvUpload effectiveUser={null} onErrorAction={jest.fn()} />);
    await waitFor(() => expect(mockReplace).toHaveBeenCalled());
  });

  test("blocks non EXP_USER with AccessDenied", () => {
    render(<CsvUpload effectiveUser={{ role: "user" }} onErrorAction={jest.fn()} />);
    expect(screen.getByTestId("access-denied")).toBeInTheDocument();
  });

  test("validates extension and reports errors on drop/select", () => {
    const onError = jest.fn();
    render(<CsvUpload effectiveUser={{ role: "EXP_USER" }} onErrorAction={onError} />);

    const dropZone = screen.getByTestId("csv-drop-zone");
    fireEvent.drop(dropZone, {
      preventDefault: () => {},
      dataTransfer: { files: [new File(["x"], "bad.txt", { type: "text/plain" })] },
    });
    expect(onError).toHaveBeenCalledWith("Hanya file CSV (.csv) yang diizinkan.");
  });

  test("uploads CSV and shows filename", async () => {
    const onSuccess = jest.fn();
    const okResponse = {
      ok: true,
      json: () => Promise.resolve({ created: 2, batch_id: "b1" }),
      text: () => Promise.resolve(""),
    };
    (global.fetch as jest.Mock).mockResolvedValue(okResponse);

    render(
      <CsvUpload
        effectiveUser={{ role: "exp_user" }}
        onSuccessAction={onSuccess}
        onErrorAction={jest.fn()}
      />
    );

    const input = screen.getByTestId("csv-file-input") as HTMLInputElement;
    const file = new File(["id,name"], "data.csv", { type: "text/csv" });
    await act(async () => {
      fireEvent.change(input, { target: { files: [file] } });
    });

    await waitFor(() => expect(onSuccess).toHaveBeenCalled());
    expect(screen.getByTestId("csv-filename")).toHaveTextContent("data.csv");
  });

  test("falls back to window.location when router replace fails", async () => {
    const originalLocation = window.location;
    mockReplace.mockImplementation(() => {
      throw new Error("fail");
    });
    Object.defineProperty(window, "location", {
      value: { href: "", pathname: "/expert-bulk-upload" },
      writable: true,
    });

    render(<CsvUpload effectiveUser={null} onErrorAction={jest.fn()} />);

    await waitFor(() =>
      expect(window.location.href).toContain("/login?next=%2Fexpert-bulk-upload")
    );

    Object.defineProperty(window, "location", {
      value: originalLocation,
    });
    mockReplace.mockReset();
  });

  test("surfaces API error messages", async () => {
    const onError = jest.fn();
    const errorResponse = {
      ok: false,
      status: 500,
      text: () => Promise.resolve(JSON.stringify({ message: "Upload failed" })),
    };
    (global.fetch as jest.Mock).mockResolvedValue(errorResponse);

    render(<CsvUpload effectiveUser={{ role: "EXP_USER" }} onErrorAction={onError} />);

    const input = screen.getByTestId("csv-file-input") as HTMLInputElement;
    await act(async () => {
      fireEvent.change(input, {
        target: { files: [new File(["id,name"], "data.csv", { type: "text/csv" })] },
      });
    });

    await waitFor(() => expect(onError).toHaveBeenCalledWith("Upload failed"));
  });

  test("surfaces API errors bag when provided", async () => {
    const onError = jest.fn();
    const errorResponse = {
      ok: false,
      status: 400,
      text: () => Promise.resolve(JSON.stringify({ errors: { field: ["bad"] } })),
    };
    (global.fetch as jest.Mock).mockResolvedValue(errorResponse);

    render(
      <CsvUpload
        effectiveUser={{ role: "EXP_USER" }}
        onSuccessAction={jest.fn()}
        onErrorAction={onError}
      />
    );

    const input = screen.getByTestId("csv-file-input") as HTMLInputElement;
    await act(async () => {
      fireEvent.change(input, {
        target: { files: [new File(["id,name"], "data.csv", { type: "text/csv" })] },
      });
    });

    await waitFor(() => expect(onError).toHaveBeenCalledWith(expect.stringContaining("field")));
  });

  test("handles network failures during upload", async () => {
    const onError = jest.fn();
    (global.fetch as jest.Mock).mockRejectedValue(new Error("boom"));

    render(<CsvUpload effectiveUser={{ role: "EXP_USER" }} onErrorAction={onError} />);

    const input = screen.getByTestId("csv-file-input") as HTMLInputElement;
    await act(async () => {
      fireEvent.change(input, {
        target: { files: [new File(["id,name"], "data.csv", { type: "text/csv" })] },
      });
    });

    await waitFor(() => expect(onError).toHaveBeenCalledWith("boom"));
  });

  test("blocks drag-and-drop and manual selection for non EXP_USER", () => {
    const onError = jest.fn();
    render(<CsvUpload effectiveUser={null} onErrorAction={onError} />);

    const dropZone = screen.getByTestId("csv-drop-zone");
    const csvFile = new File(["id"], "valid.csv", { type: "text/csv" });
    fireEvent.drop(dropZone, {
      preventDefault: () => {},
      dataTransfer: { files: [csvFile] },
    });
    expect(onError).toHaveBeenCalledWith("Hanya EXP_USER dapat mengunggah CSV.");
  });

  test("toggles hover state on drag over and leave", () => {
    render(<CsvUpload effectiveUser={{ role: "EXP_USER" }} onErrorAction={jest.fn()} />);
    const dropZone = screen.getByTestId("csv-drop-zone");

    fireEvent.dragOver(dropZone, { preventDefault: () => {} });
    expect(dropZone.className).toContain("border-blue-400");

    fireEvent.dragLeave(dropZone);
    expect(dropZone.className).not.toContain("border-blue-400");
  });
});

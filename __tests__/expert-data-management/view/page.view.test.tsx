/**
 * @jest-environment jsdom
 */
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { useRouter, useSearchParams } from "next/navigation";
import ExpertViewPage from "../../../app/expert-data-management/view/page";
import "@testing-library/jest-dom";

// --- Mock router and search params ---
const mockBack = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
}));

// --- Mock layout components ---
jest.mock("../../../app/components/Navbar", () => () => <div data-testid="navbar">Navbar</div>);
jest.mock("../../../app/components/Footer", () => () => <div data-testid="footer">Footer</div>);

// --- Mock global fetch ---
global.fetch = jest.fn();

describe("ExpertViewPage – API fetching behavior", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockParams = (params: Record<string, string | null>) => {
    (useSearchParams as jest.Mock).mockReturnValue({
      get: (key: string) => params[key],
    });
  };

  (useRouter as jest.Mock).mockReturnValue({ back: mockBack });

  // --- SUCCESS ---
  test("renders dataset title and rows on successful fetch", async () => {
    mockParams({
      id: "123",
      fileName: "Dataset A",
      lastEdited: "2025-11-09",
      submittedBy: "Expert A",
    });

    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        results: [
          {
            data_id: "1",
            gender: "Laki-laki",
            age: 24,
            city: "Jakarta",
            status: "Aktif",
            disease_id: "D001",
            severity: "Ringan",
          },
        ],
      }),
    });

    render(<ExpertViewPage />);

    // Suspense fallback visible first
    expect(screen.getByText(/Loading data/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("Dataset A")).toBeInTheDocument();
      expect(screen.getByText("Jakarta")).toBeInTheDocument();
      expect(screen.getByText("Laki-laki")).toBeInTheDocument();
      expect(screen.getByTestId("navbar")).toBeInTheDocument();
      expect(screen.getByTestId("footer")).toBeInTheDocument();
    });
  });

  // --- EMPTY ---
  test("renders 'No data available' when API returns empty array", async () => {
    mockParams({
      id: "999",
      fileName: "Empty Dataset",
      lastEdited: "",
      submittedBy: "",
    });

    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ results: [] }),
    });

    render(<ExpertViewPage />);

    await waitFor(() =>
      expect(screen.getByText("No data available")).toBeInTheDocument()
    );
  });

  // --- ERROR STATE ---
  test("renders error message when fetch fails", async () => {
    mockParams({
      id: "error",
      fileName: "Broken Dataset",
      lastEdited: "",
      submittedBy: "",
    });

    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 500,
    });

    render(<ExpertViewPage />);

    await waitFor(() =>
      expect(screen.getByText("Gagal memuat data baris.")).toBeInTheDocument()
    );
  });

  // --- NETWORK THROW ---
  test("handles thrown network error safely", async () => {
    mockParams({
      id: "throw",
      fileName: "Network Error Dataset",
      lastEdited: "",
      submittedBy: "",
    });

    (fetch as jest.Mock).mockImplementationOnce(() => {
      throw new Error("Network down");
    });

    render(<ExpertViewPage />);

    await waitFor(() =>
      expect(screen.getByText("Gagal memuat data baris.")).toBeInTheDocument()
    );
  });

  // --- MISSING dataId ---
  test("renders nothing when no dataId is present", async () => {
    mockParams({
      id: "",
      fileName: "Missing ID Dataset",
      lastEdited: "",
      submittedBy: "",
    });

    render(<ExpertViewPage />);

    // Should render Navbar + Footer but not data rows
    expect(screen.getByTestId("navbar")).toBeInTheDocument();
    expect(screen.getByTestId("footer")).toBeInTheDocument();
    expect(screen.queryByText("No data available")).not.toBeInTheDocument();
  });

  // --- BACK BUTTON ---
  test("clicking '< back' triggers router.back()", async () => {
    mockParams({
      id: "123",
      fileName: "Dataset Back Test",
      lastEdited: "",
      submittedBy: "",
    });

    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ results: [] }),
    });

    render(<ExpertViewPage />);

    await waitFor(() => screen.getByText("< back"));
    fireEvent.click(screen.getByText("< back"));
    expect(mockBack).toHaveBeenCalled();
  });
});
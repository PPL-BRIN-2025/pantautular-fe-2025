/**
 * @jest-environment jsdom
 */
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { useRouter, useSearchParams } from "next/navigation";
import ExpertViewPage from "../../../app/expert-data-management/view/page";
import "@testing-library/jest-dom";
import React from "react";

// --- Mock router and search params ---
const mockBack = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
}));

// --- Mock layout components ---
jest.mock("../../../app/components/Navbar", () => ({
  __esModule: true,
  default: () => <div data-testid="navbar">Navbar</div>,
}));
jest.mock("../../../app/components/Footer", () => ({
  __esModule: true,
  default: () => <div data-testid="footer">Footer</div>,
}));
jest.mock("../../../app/auth/hooks/useAuth", () => ({
  useAuth: () => ({ user: { role: "EXP_USER" } }),
}));

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

    expect(screen.getByText(/Loading data/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("Dataset A")).toBeInTheDocument();
      expect(screen.getByText("Jakarta")).toBeInTheDocument();
      expect(screen.getByText("Laki-laki")).toBeInTheDocument();
      expect(screen.getByText(/Last edited/)).toBeInTheDocument();
      expect(screen.getByText(/Submitted by/)).toBeInTheDocument();
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

  // --- PAYLOAD FALLBACKS ---
  test("renders fallback data from payload when top-level fields are missing", async () => {
    mockParams({
      id: "456",
      fileName: "Payload Fallbacks",
      lastEdited: "",
      submittedBy: "",
    });

    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        results: [
          {
            data_id: "2",
            gender: "Perempuan",
            age: 30,
            city: "Surabaya",
            status: "Sembuh",
            payload: {
              disease: { name: "Flu" },
              location: { province: "Jawa Timur" },
              news: {
                portal: "Portal Sehat",
                title: "Kasus Flu Menurun",
                type: "Kesehatan",
                content: "Artikel singkat",
                url: "http://example.com",
                author: "Reporter X",
                date_published: "2025-01-01",
              },
            },
            severity: "Sedang",
          },
        ],
      }),
    });

    render(<ExpertViewPage />);
    await waitFor(() => {
      expect(screen.getByText("Flu")).toBeInTheDocument();
      expect(screen.getByText("Jawa Timur")).toBeInTheDocument();
      expect(screen.getByText("Portal Sehat")).toBeInTheDocument();
      expect(screen.getByText("Kasus Flu Menurun")).toBeInTheDocument();
      expect(screen.getByText("Reporter X")).toBeInTheDocument();
    });
  });

  // --- MISSING dataId ---
  test("renders static layout but skips fetching when no dataId present", async () => {
    mockParams({
      id: "",
      fileName: "Missing ID Dataset",
      lastEdited: "",
      submittedBy: "",
    });

    render(<ExpertViewPage />);
    expect(screen.getByTestId("navbar")).toBeInTheDocument();
    expect(screen.getByTestId("footer")).toBeInTheDocument();
    expect(global.fetch).not.toHaveBeenCalled();
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

  // --- DATA SHAPE FALLBACK ---
  test("handles API responses that use 'data' instead of 'results'", async () => {
    mockParams({
      id: "alt-shape",
      fileName: "Alt Shape Dataset",
      lastEdited: "",
      submittedBy: "",
    });

    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: [
          {
            data_id: "ALT1",
            gender: "Laki-laki",
            age: 40,
            city: "Bekasi",
            status: "Aktif",
            disease_id: "D999",
            severity: "Berat",
          },
        ],
      }),
    });

    render(<ExpertViewPage />);
    await waitFor(() => {
      expect(screen.getByText("Bekasi")).toBeInTheDocument();
      expect(screen.getByText("ALT1")).toBeInTheDocument();
    });
  });

  // --- MIXED PAYLOAD FALLBACKS ---
  test("renders correctly when payload uses flat string keys instead of nested objects", async () => {
    mockParams({
      id: "789",
      fileName: "Flat Payload Dataset",
      lastEdited: "",
      submittedBy: "",
    });

    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        results: [
          {
            data_id: "9",
            gender: "Laki-laki",
            age: 27,
            city: "Depok",
            status: "Aktif",
            disease_id: "D009",
            payload: {
              disease: "Rabies",
              news_portal: "CNN",
              news_title: "Rabies Case",
              news_type: "Health",
              news_content: "Satu korban akibat rabies",
              news_url: "https://cnn.com/rabies3",
              news_author: "Reporter S",
              news_date_published: "2024-08-02",
              location: { province: "Jawa Barat" },
            },
            severity: "Hospitalisasi",
          },
        ],
      }),
    });

    render(<ExpertViewPage />);
    await waitFor(() => {
      expect(screen.getByText("Rabies")).toBeInTheDocument();
      expect(screen.getByText("CNN")).toBeInTheDocument();
      expect(screen.getByText("Rabies Case")).toBeInTheDocument();
      expect(screen.getByText("Reporter S")).toBeInTheDocument();
      expect(screen.getByText("Hospitalisasi")).toBeInTheDocument();

      const link = screen.getByRole("link", { name: /https:\/\/cnn.com\/rabies3/i });
      expect(link).toHaveAttribute("href", "https://cnn.com/rabies3");
    });
  });
});

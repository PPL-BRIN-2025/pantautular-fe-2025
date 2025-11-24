/**
 * @jest-environment jsdom
 */
import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import React from "react";
import ExpertViewPage from "../../../app/expert-data-management/view/page";
import { useRouter, useSearchParams } from "next/navigation";

const mockBack = jest.fn();
const mockReplace = jest.fn();

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
const mockUseAuth = jest.fn();

jest.mock("../../../app/auth/hooks/useAuth", () => ({
  useAuth: () => mockUseAuth(),
}));

jest.mock("../../../app/components/Navbar", () => () => (
  <div data-testid="navbar">Navbar</div>
));
jest.mock("../../../app/components/Footer", () => () => (
  <div data-testid="footer">Footer</div>
));
jest.mock("../../../app/components/AccessDenied2", () => () => (
  <div data-testid="access-denied">Access denied</div>
));

const setParams = (params: Record<string, string | null>) => {
  (useSearchParams as jest.Mock).mockReturnValue({
    get: (key: string) => params[key] ?? null,
  });
};

describe("ExpertViewPage", () => {
  beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue({
      back: mockBack,
      replace: mockReplace,
    });
    mockBack.mockReset();
    mockReplace.mockReset();
    mockUseAuth.mockReset();
    mockUseAuth.mockReturnValue({ user: { role: "EXP_USER" } });
    window.localStorage.clear();
    (global as any).fetch = jest.fn();
  });

  test("redirects to login when unauthenticated and no stored user", async () => {
    mockUseAuth.mockReturnValue({ user: null });
    setParams({
      id: "123",
      fileName: "Dataset Redirect",
      lastEdited: "",
      submittedBy: "",
    });

    render(<ExpertViewPage />);

    await waitFor(() =>
      expect(mockReplace).toHaveBeenCalledWith("/login?next=%2Fexpert-data-management")
    );
    expect(screen.getByText(/Memeriksa akses/i)).toBeInTheDocument();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  test("uses stored user fallback when hook returns null", async () => {
    mockUseAuth.mockReturnValue({ user: null });
    window.localStorage.setItem("user", JSON.stringify({ role: "EXP_USER" }));
    setParams({
      id: "stored",
      fileName: "Stored Dataset",
      lastEdited: "",
      submittedBy: "",
    });
    (global as any).fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        results: [
          {
            data_id: "S1",
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

    expect(await screen.findByText("Stored Dataset")).toBeInTheDocument();
    expect(await screen.findByText("Jakarta")).toBeInTheDocument();
  });

  test("renders provided dataset prop without hitting the API", async () => {
    setParams({
      id: "",
      fileName: "Ignored name",
      lastEdited: "",
      submittedBy: "",
    });

    const injectedRows = [
      {
        data_id: "INJ-1",
        gender: "Perempuan",
        age: 32,
        city: "Surabaya",
        status: "Aktif",
        disease_id: "D-123",
        severity: "Sedang",
        location_id: "LOC-1",
      },
    ];

    render(<ExpertViewPage dataset={injectedRows} fileName="Injected Dataset" />);

    await waitFor(() => {
      expect(screen.getByText("Injected Dataset")).toBeInTheDocument();
      expect(screen.getByText("Surabaya")).toBeInTheDocument();
    });
    expect(global.fetch).not.toHaveBeenCalled();
  });

  test("shows access denied for unsupported role", async () => {
    mockUseAuth.mockReturnValue({ user: { role: "CURATOR" } });
    setParams({
      id: "foo",
      fileName: "Forbidden Dataset",
      lastEdited: "",
      submittedBy: "",
    });

    render(<ExpertViewPage />);

    expect(await screen.findByTestId("access-denied")).toBeInTheDocument();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  test("treats missing role metadata as forbidden access", async () => {
    mockUseAuth.mockReturnValue({ user: {} as any });
    setParams({
      id: "missing-role",
      fileName: "Dataset Missing Role",
      lastEdited: "",
      submittedBy: "",
    });

    render(<ExpertViewPage />);

    expect(await screen.findByTestId("access-denied")).toBeInTheDocument();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  test("renders dataset title and rows on successful fetch", async () => {
    setParams({
      id: "123",
      fileName: "Dataset A",
      lastEdited: "2025-11-09",
      submittedBy: "Expert A",
    });

    (global as any).fetch.mockResolvedValueOnce({
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

    await waitFor(() => {
      expect(screen.getByText("Dataset A")).toBeInTheDocument();
      expect(screen.getByText("Jakarta")).toBeInTheDocument();
      expect(screen.getByText("Laki-laki")).toBeInTheDocument();
      expect(screen.getByText(/Last edited/)).toBeInTheDocument();
      expect(screen.getByText(/Submitted by/)).toBeInTheDocument();
    });
  });

  test("falls back to default dataset title when param is missing", async () => {
    setParams({
      id: "missing-name",
      fileName: null,
      lastEdited: "",
      submittedBy: "",
    });

    (global as any).fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ results: [] }),
    });

    render(<ExpertViewPage />);
    expect(await screen.findByText("Dataset Detail")).toBeInTheDocument();
  });

  test("default export exposes Suspense fallback when rendered without props", () => {
    const element = ExpertViewPage();
    expect(element.props.fallback.props.children).toContain("Loading data...");
  });

  test("renders 'No data available' when API returns empty array", async () => {
    setParams({
      id: "999",
      fileName: "Empty Dataset",
      lastEdited: "",
      submittedBy: "",
    });

    (global as any).fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ results: [] }),
    });

    render(<ExpertViewPage />);
    await waitFor(() =>
      expect(screen.getByText("No data available")).toBeInTheDocument()
    );
  });

  test("handles responses without results or data arrays by treating them as empty", async () => {
    setParams({
      id: "no-array",
      fileName: "No Array Dataset",
      lastEdited: "",
      submittedBy: "",
    });

    (global as any).fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ detail: "ok" }),
    });

    render(<ExpertViewPage />);
    await waitFor(() =>
      expect(screen.getByText("No data available")).toBeInTheDocument()
    );
  });

  test("renders error message when fetch fails", async () => {
    setParams({
      id: "error",
      fileName: "Broken Dataset",
      lastEdited: "",
      submittedBy: "",
    });

    (global as any).fetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
    });

    render(<ExpertViewPage />);
    await waitFor(() =>
      expect(screen.getByText("Gagal memuat data baris.")).toBeInTheDocument()
    );
  });

  test("handles thrown network error safely", async () => {
    setParams({
      id: "throw",
      fileName: "Network Error Dataset",
      lastEdited: "",
      submittedBy: "",
    });

    (global as any).fetch.mockImplementationOnce(() => {
      throw new Error("Network down");
    });

    render(<ExpertViewPage />);
    await waitFor(() =>
      expect(screen.getByText("Gagal memuat data baris.")).toBeInTheDocument()
    );
  });

  test("renders fallback data from payload when top-level fields are missing", async () => {
    setParams({
      id: "456",
      fileName: "Payload Fallbacks",
      lastEdited: "",
      submittedBy: "",
    });

    (global as any).fetch.mockResolvedValueOnce({
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

  test("renders static layout but skips fetching when no dataId present", () => {
    setParams({
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

  test("clicking '< back' triggers router.back()", async () => {
    setParams({
      id: "123",
      fileName: "Dataset Back Test",
      lastEdited: "",
      submittedBy: "",
    });

    (global as any).fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ results: [] }),
    });

    render(<ExpertViewPage />);
    await waitFor(() => screen.getByText("< back"));
    fireEvent.click(screen.getByText("< back"));
    expect(mockBack).toHaveBeenCalled();
  });

  test("handles API responses that use 'data' instead of 'results'", async () => {
    setParams({
      id: "alt-shape",
      fileName: "Alt Shape Dataset",
      lastEdited: "",
      submittedBy: "",
    });

    (global as any).fetch.mockResolvedValueOnce({
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

  test("renders correctly when payload uses flat string keys instead of nested objects", async () => {
    setParams({
      id: "789",
      fileName: "Flat Payload Dataset",
      lastEdited: "",
      submittedBy: "",
    });

    (global as any).fetch.mockResolvedValueOnce({
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

      const link = screen.getByRole("link", { name: /https:\/\/cnn.com\/rabies3/i });
      expect(link).toHaveAttribute("href", "https://cnn.com/rabies3");
    });
  });
});

import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { okJson, resp } from "../utils/http";

const mockPush = jest.fn();
jest.mock("next/navigation", () => ({
  // minimal surface we use
  useRouter: () => ({
    push: mockPush,
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
}));

// isolate Navbar/Footer so layout changes don't break tests
jest.mock("../../app/components/Navbar", () => () => <div data-testid="mock-navbar">Navbar</div>);
jest.mock("../../app/components/Footer", () => () => <div data-testid="mock-footer">Footer</div>);

// Make the component think we are a CURATOR by default
jest.mock("../../app/auth/hooks/useAuth", () => ({
  useAuth: () => ({ user: { role: "CURATOR" } }),
}));

// --- helpers to match text that may be split across multiple nodes ---
const byTextContent = (t: string) =>
  (_: string, node?: Element | null) => node?.textContent?.trim() === t;

const byTextContentLoose = (re: RegExp) =>
  (_: string, node?: Element | null) => {
    const txt = node?.textContent?.replace(/\s+/g, " ").trim() ?? "";
    return re.test(txt);
  };

import CuratorDataManagementPage from "../../app/curator-data-management/page";

const ORIGINAL_LOCATION = window.location;

beforeEach(() => {
  (global.fetch as any) = jest.fn();

  delete (window as any).location;
  (window as any).location = { href: "/" };
  localStorage.clear();
  localStorage.setItem("accessToken", "test-token");
  document.cookie = "access_token=; expires=Thu, 01 Jan 1970 00:00:00 GMT";

  mockPush.mockClear();
});

afterAll(() => {
  (window as any).location = ORIGINAL_LOCATION as any;
});

//
// 403
//
test("403 → shows generic fetch error", async () => {
  (global.fetch as jest.Mock).mockImplementation(() =>
    resp(403, { detail: "Only CURATOR role allowed" })
  );

  render(<CuratorDataManagementPage />);
  expect(
    await screen.findByText(/Gagal mengambil data audit trail/i)
  ).toBeInTheDocument();
});

//
// Data Render
//
describe("CuratorDataManagementPage • Data render", () => {
  test("renders label, headers, first row, and counts", async () => {
    (global.fetch as jest.Mock).mockImplementation(() =>
      okJson({
        data: [
          {
            id: 1,
            data_id: "PT-001",
            title: "Kasus Demam",
            last_edited: "2025-01-01T00:00:00Z",
            submitted_by: "chiara",
          },
          {
            id: 2,
            data_id: "PT-002",
            title: "Kasus Batuk",
            last_edited: "2025-01-02T00:00:00Z",
            submitted_by: "darren",
          },
        ],
        page: 1,
        pageSize: 8,
        total: 2,
      })
    );

    render(<CuratorDataManagementPage />);

    // label (match localized UI)
    expect(await screen.findByText(/Daftar Data/i)).toBeInTheDocument();
    // headers (match current localized UI)
    for (const h of ["ID Data", "Judul", "Terakhir Diubah", "Dikumpulkan Oleh", "Aksi"]) {
      expect(screen.getByText(h)).toBeInTheDocument();
    }

    // first row presence + footer
        expect(await screen.findByText(/PT-001/)).toBeInTheDocument();
        expect(await screen.findByText(/Kasus Demam/)).toBeInTheDocument();
        expect(
          await screen.findByText(
            byTextContentLoose(/^Menampilkan\s*2\s*dari\s*2\s*data$/i)
          )
        ).toBeInTheDocument();
  });
});

//
// Pagination
//
describe("CuratorDataManagementPage • Pagination", () => {
  test("Next/Prev fetch the right pages and update indicator", async () => {
    (global.fetch as jest.Mock)
      .mockImplementationOnce((url: string) => {
        expect(url).toMatch(/page=1/);
        return okJson({
          data: Array.from({ length: 8 }, (_, i) => ({
            id: i + 1,
            data_id: `ID-P1-${i + 1}`,
            title: `T${i + 1}`,
            last_edited: null,
            submitted_by: null,
          })),
          page: 1,
          pageSize: 8,
          total: 16,
        });
      })
      .mockImplementationOnce((url: string) => {
        expect(url).toMatch(/page=2/);
        return okJson({
          data: Array.from({ length: 8 }, (_, i) => ({
            id: i + 9,
            data_id: `ID-P2-${i + 1}`,
            title: `T${i + 9}`,
            last_edited: null,
            submitted_by: null,
          })),
          page: 2,
          pageSize: 8,
          total: 16,
        });
      })
      .mockImplementationOnce((url: string) => {
        expect(url).toMatch(/page=1/);
        return okJson({
          data: Array.from({ length: 8 }, (_, i) => ({
            id: i + 1,
            data_id: `ID-P1-${i + 1}`,
            title: `T${i + 1}`,
            last_edited: null,
            submitted_by: null,
          })),
          page: 1,
          pageSize: 8,
          total: 16,
        });
      });

    render(<CuratorDataManagementPage />);

    await waitFor(() =>
      expect(screen.getByText(byTextContentLoose(/^1\s*\/\s*2$/))).toBeInTheDocument()
    );
    fireEvent.click(screen.getByText(/Next/i));
    await waitFor(() =>
      expect(screen.getByText(byTextContentLoose(/^2\s*\/\s*2$/))).toBeInTheDocument()
    );
    fireEvent.click(screen.getByText(/Prev/i));
    await waitFor(() =>
      expect(screen.getByText(byTextContentLoose(/^1\s*\/\s*2$/))).toBeInTheDocument()
    );
  });

  test("Prev disabled on first page; Next disabled on last page", async () => {
    (global.fetch as jest.Mock)
      .mockImplementationOnce(() =>
        okJson({
          data: Array.from({ length: 8 }, (_, i) => ({
            id: i + 1,
            data_id: `ID-P1-${i + 1}`,
            title: `T${i + 1}`,
            last_edited: null,
            submitted_by: null,
          })),
          page: 1,
          pageSize: 8,
          total: 16,
        })
      )
      .mockImplementationOnce(() =>
        okJson({
          data: Array.from({ length: 8 }, (_, i) => ({
            id: i + 9,
            data_id: `ID-P2-${i + 1}`,
            title: `T${i + 9}`,
            last_edited: null,
            submitted_by: null,
          })),
          page: 2,
          pageSize: 8,
          total: 16,
        })
      );

    render(<CuratorDataManagementPage />);
    const prev = await screen.findByText(/Prev/i);
    const next = screen.getByText(/Next/i);

    expect(prev).toBeDisabled();
    fireEvent.click(next);
    await waitFor(() =>
      expect(screen.getByText(byTextContentLoose(/^2\s*\/\s*2$/))).toBeInTheDocument()
    );
    expect(screen.getByText(/Next/i)).toBeDisabled();
  });
});

//
// Auth header
//
describe("CuratorDataManagementPage • Auth header", () => {
  test("sends Authorization: Bearer <token>", async () => {
    localStorage.setItem("accessToken", "abc123");
    (global.fetch as jest.Mock).mockImplementation((_url: string, init?: RequestInit) => {
      const headers = (init?.headers ?? {}) as Record<string, string>;
      expect(Object.values(headers)).toEqual(
        expect.arrayContaining([expect.stringMatching(/^Bearer abc123$/)])
      );
      return okJson({ data: [], page: 1, pageSize: 8, total: 0 });
    });

    render(<CuratorDataManagementPage />);
    // Empty list shows this text
    expect(
      await screen.findByText(/Tidak ada data yang cocok\./i)
    ).toBeInTheDocument();
  });
});

//
// Error Feature
//
describe("CuratorDataManagementPage • Error display", () => {
  // silence noisy console.error just for these tests
  let errSpy: jest.SpyInstance;
  beforeAll(() => {
    errSpy = jest.spyOn(console, "error").mockImplementation(() => {});
  });
  afterAll(() => {
    errSpy.mockRestore();
  });

  test("500 → shows generic fetch error", async () => {
    (global.fetch as jest.Mock).mockImplementation(() => resp(500, "Server boom"));
    render(<CuratorDataManagementPage />);
    expect(
      await screen.findByText(/Gagal mengambil data audit trail/i)
    ).toBeInTheDocument();
  });

  test("network error → shows generic fetch error", async () => {
    (global.fetch as jest.Mock).mockImplementation(() =>
      Promise.reject(new Error("Network down"))
    );
    render(<CuratorDataManagementPage />);
    expect(
      await screen.findByText(/Gagal mengambil data audit trail/i)
    ).toBeInTheDocument();
  });
});

//
// Filtering (server-side search)
//
describe("CuratorDataManagementPage • Filtering", () => {
  test("typing in search triggers fetch with ?search=… and resets to page 1", async () => {
    (global.fetch as jest.Mock)
      // initial request
      .mockImplementationOnce((url: string) => {
        expect(url).toMatch(/page=1/);
        expect(url).toMatch(/search=/);
        return okJson({ data: [], page: 1, pageSize: 8, total: 0 });
      })
      // after typing 'penyakit'
      .mockImplementationOnce((url: string) => {
        expect(url).toMatch(/page=1/); // reset to first page
        expect(url).toMatch(/search=penyakit/);
        return okJson({
          data: [
            {
              id: 1,
              data_id: "PT-100",
              title: "Penyakit Kulit",
              last_edited: null,
              submitted_by: null,
            },
          ],
          page: 1,
          pageSize: 8,
          total: 1,
        });
      });

    render(<CuratorDataManagementPage />);

    const input = await screen.findByPlaceholderText(/Cari ID \/ Judul/i);
    fireEvent.change(input, { target: { value: "penyakit" } });

    expect(await screen.findByText("PT-100")).toBeInTheDocument();
  });

  test("resets pagination when filter reduces page count", async () => {
    (global.fetch as jest.Mock)
      // page 1 (16 total)
      .mockImplementationOnce((url: string) => {
        expect(url).toMatch(/page=1/);
        return okJson({
          data: Array.from({ length: 8 }, (_, i) => ({
            id: i + 1,
            data_id: `ID${i + 1}`,
            title: `T${i + 1}`,
            last_edited: null,
            submitted_by: null,
          })),
          page: 1,
          pageSize: 8,
          total: 16,
        });
      })
      // page 2
      .mockImplementationOnce((_url: any) => {
        return okJson({
          data: Array.from({ length: 8 }, (_, i) => ({
            id: i + 9,
            data_id: `ID${i + 9}`,
            title: `T${i + 9}`,
            last_edited: null,
            submitted_by: null,
          })),
          page: 2,
          pageSize: 8,
          total: 16,
        });
      })
      // after filter: shrink to 1 item on page 1
      .mockImplementationOnce((_url: any) => {
        return okJson({
          data: [{ id: 42, data_id: "ID42", title: "KuratorX", last_edited: null, submitted_by: null }],
          page: 1,
          pageSize: 8,
          total: 1,
        });
      });

    render(<CuratorDataManagementPage />);

    // ensure page 1 is fully shown before we paginate
    await screen.findByText(byTextContentLoose(/^1\s*\/\s*\d+$/));

    // Move to page 2
    fireEvent.click(screen.getByText(/Next/i));
    await screen.findByText(byTextContentLoose(/^2\s*\/\s*\d+$/));

// Apply filter -> should reset to page 1
    const input = screen.getByPlaceholderText(/Cari ID/i);
    fireEvent.change(input, { target: { value: "kuratorx" } });

    await screen.findByText(byTextContentLoose(/^1\s*\/\s*1$/));
  });
});

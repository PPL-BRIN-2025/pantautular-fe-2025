import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { okJson, resp } from "../utils/http";

// isolate Navbar/Footer so layout changes don't break tests
jest.mock("../../app/components/Navbar", () => () => <div data-testid="mock-navbar">Navbar</div>);
jest.mock("../../app/components/Footer", () => () => <div data-testid="mock-footer">Footer</div>);

import CuratorDataManagementPage from "../../app/curator-data-management/page";

const ORIGINAL_LOCATION = window.location;

beforeEach(() => {
  (global.fetch as any) = jest.fn();

  delete (window as any).location;
  (window as any).location = { href: "/" };
  localStorage.clear();
  document.cookie = "access_token=; expires=Thu, 01 Jan 1970 00:00:00 GMT";
});

afterAll(() => {
  (window as any).location = ORIGINAL_LOCATION as any;
});

// Auth Failures/Access Control
test("403 → shows 'Akses Ditolak' with backend detail", async () => {
  (global.fetch as jest.Mock).mockImplementation(() =>
    resp(403, { detail: "Only CURATOR role allowed" })
  );

  render(<CuratorDataManagementPage />);

  expect(await screen.findByText("Akses Ditolak")).toBeInTheDocument();
  expect(screen.getByText(/Only CURATOR role allowed/i)).toBeInTheDocument();
  expect(screen.getByText("Kembali")).toBeInTheDocument();
  expect(screen.getByText("Masuk")).toBeInTheDocument();
});


// Data Render 
describe("CuratorDataManagementPage • Data render", () => {
  test("renders label, headers, first row, and counts", async () => {
    (global.fetch as jest.Mock).mockImplementation(() =>
      okJson({
        data: [
          { id: "c1", gender: "F", age: 21, city: "Bandung", status: "OK", disease_id: null, location_id: null, severity: "LOW" },
          { id: "c2", gender: "M", age: 35, city: "Jakarta", status: "OK", disease_id: null, location_id: null, severity: "HIGH" },
        ],
        page: 1, pageSize: 8, total: 2,
      })
    );

    render(<CuratorDataManagementPage />);

    // label
    expect(await screen.findByText(/List Data/i)).toBeInTheDocument();
    // headers (match the real FE)
    expect(screen.getByText("ID")).toBeInTheDocument();
    expect(screen.getByText("Gender")).toBeInTheDocument();
    expect(screen.getByText("Age")).toBeInTheDocument();
    expect(screen.getByText("City")).toBeInTheDocument();
    expect(screen.getByText("Severity")).toBeInTheDocument();
    // row + footer
    expect(screen.getByText("c1")).toBeInTheDocument();
    expect(screen.getByText("Bandung")).toBeInTheDocument();
    expect(screen.getByText(/Menampilkan\s+2\s+dari\s+2\s+data/i)).toBeInTheDocument();
  });
});

// Pagination
describe("CuratorDataManagementPage • Pagination", () => {
  test("Next/Prev fetch the right pages and update indicator", async () => {
    (global.fetch as jest.Mock)
      .mockImplementationOnce((url: string) => {
        expect(url).toMatch(/page=1/);
        return okJson({
          data: Array.from({ length: 8 }, (_, i) => ({ id: `p1-${i+1}`, gender: null, age: null, city: null, status: null, disease_id: null, location_id: null, severity: null })),
          page: 1, pageSize: 8, total: 16,
        });
      })
      .mockImplementationOnce((url: string) => {
        expect(url).toMatch(/page=2/);
        return okJson({
          data: Array.from({ length: 8 }, (_, i) => ({ id: `p2-${i+1}`, gender: null, age: null, city: null, status: null, disease_id: null, location_id: null, severity: null })),
          page: 2, pageSize: 8, total: 16,
        });
      })
      .mockImplementationOnce((url: string) => {
        expect(url).toMatch(/page=1/);
        return okJson({
          data: Array.from({ length: 8 }, (_, i) => ({ id: `p1-${i+1}`, gender: null, age: null, city: null, status: null, disease_id: null, location_id: null, severity: null })),
          page: 1, pageSize: 8, total: 16,
        });
      });

    render(<CuratorDataManagementPage />);

    await waitFor(() => expect(screen.getByText("1 / 2")).toBeInTheDocument());
    fireEvent.click(screen.getByText(/Next/i));
    await waitFor(() => expect(screen.getByText("2 / 2")).toBeInTheDocument());
    fireEvent.click(screen.getByText(/Prev/i));
    await waitFor(() => expect(screen.getByText("1 / 2")).toBeInTheDocument());
  });

  test("Prev disabled on first page; Next disabled on last page", async () => {
    (global.fetch as jest.Mock)
      .mockImplementationOnce(() => okJson({ data: Array.from({ length: 8 }, (_, i) => ({ id: `p1-${i+1}` })), page: 1, pageSize: 8, total: 16 }))
      .mockImplementationOnce(() => okJson({ data: Array.from({ length: 8 }, (_, i) => ({ id: `p2-${i+1}` })), page: 2, pageSize: 8, total: 16 }));

    render(<CuratorDataManagementPage />);
    const prev = await screen.findByText(/Prev/i);
    const next = screen.getByText(/Next/i);

    expect(prev).toBeDisabled();
    fireEvent.click(next);
    await waitFor(() => expect(screen.getByText("2 / 2")).toBeInTheDocument());
    expect(screen.getByText(/Next/i)).toBeDisabled();
  });
});

//Auth Render
describe("CuratorDataManagementPage • Auth header", () => {
  test("sends Authorization: Bearer <token>", async () => {
    localStorage.setItem("access_token", "abc123");
    (global.fetch as jest.Mock).mockImplementation((_url: string, init?: RequestInit) => {
      const headers = (init?.headers ?? {}) as Record<string, string>;
      expect(Object.values(headers)).toEqual(expect.arrayContaining([expect.stringMatching(/^Bearer abc123$/)]));
      return okJson({ data: [], page: 1, pageSize: 8, total: 0 });
    });

    render(<CuratorDataManagementPage />);
    await waitFor(() => expect(screen.getByText(/Tidak ada data|Loading/i)).toBeInTheDocument());
  });
});

// Error Feature
describe("CuratorDataManagementPage • Error display", () => {
  test("500 (text body) → shows banner with status + message (RED)", async () => {
    (global.fetch as jest.Mock).mockImplementation(() => resp(500, "Server boom"));
    render(<CuratorDataManagementPage />);
    expect(await screen.findByText(/HTTP 500/i)).toBeInTheDocument();
    expect(screen.getByText(/Server boom/i)).toBeInTheDocument();
  });

  test("network error (fetch throws) → shows 'Gagal memuat' (RED)", async () => {
    (global.fetch as jest.Mock).mockImplementation(() => Promise.reject(new Error("Network down")));
    render(<CuratorDataManagementPage />);
    expect(await screen.findByText(/Gagal memuat/i)).toBeInTheDocument();
  });
});

// Filtering
describe("CuratorDataManagementPage • Filtering", () => {
  test("filters visible rows when typing in the search bar", async () => {
    (global.fetch as jest.Mock).mockImplementation(() =>
      okJson({
        data: [
          { id: "ID1", title: "Penyakit Demam", lastEdited: "2025-08-30 14:32:12", submittedBy: "KURATORA" },
          { id: "ID2", title: "Vaksin", lastEdited: "2025-08-30 14:32:12", submittedBy: "KURATORB" },
          { id: "ID3", title: "Penyebab", lastEdited: "2025-08-30 14:32:12", submittedBy: "KURATORC" },
        ],
        page: 1,
        pageSize: 8,
        total: 3,
      })
    );

    render(<CuratorDataManagementPage />);

    // Wait until the table loads
    await waitFor(() => expect(screen.getByText("Penyakit Demam")).toBeInTheDocument());

    const input = screen.getByPlaceholderText(/Cari ID/i);

    // Initially shows all rows
    expect(screen.getAllByText(/Peny/i).length).toBeGreaterThanOrEqual(2);

    // Type a query
    fireEvent.change(input, { target: { value: "vaksin" } });

    // Expect only the matching one to remain visible
    await waitFor(() => {
      expect(screen.getByText("Vaksin")).toBeInTheDocument();
      expect(screen.queryByText("Penyakit Demam")).toBeNull();
    });
  });
});

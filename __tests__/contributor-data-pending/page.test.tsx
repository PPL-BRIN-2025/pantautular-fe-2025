import React from "react";
import {
  render,
  screen,
  waitFor,
  fireEvent,
} from "@testing-library/react";
import "@testing-library/jest-dom";

// Mock layout components
jest.mock("../../app/components/Navbar", () => () => (
  <div data-testid="mock-navbar">Navbar</div>
));
jest.mock("../../app/components/Footer", () => () => (
  <div data-testid="mock-footer">Footer</div>
));
jest.mock("../../app/components/AccessDenied", () => () => (
  <div data-testid="access-denied">AccessDenied</div>
));

// Mock useAuth
const mockUseAuth = jest.fn();
jest.mock("../../app/auth/hooks/useAuth", () => ({
  useAuth: () => mockUseAuth(),
}));

// Mock router
const mockPush = jest.fn();
const mockReplace = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
  }),
}));

// Mock API
const mockListContributorEvents = jest.fn();
const mockDeleteContributorEvent = jest.fn();

jest.mock("../../api/contributorEvents", () => {
  class HttpError extends Error {
    detail: any;
    constructor(message: string, detail?: any) {
      super(message);
      this.detail = detail;
    }
  }

  return {
    listContributorEvents: (...args: any[]) =>
      mockListContributorEvents(...args),
    deleteContributorEvent: (...args: any[]) =>
      mockDeleteContributorEvent(...args),
    HttpError,
  };
});

import ContributorDataPendingPage from "../../app/contributor-data-pending/page";

beforeEach(() => {
  mockUseAuth.mockReset();
  mockUseAuth.mockReturnValue({ user: { role: "CONTRIBUTOR" } });
  mockListContributorEvents.mockReset();
  mockDeleteContributorEvent.mockReset();
  mockPush.mockReset();
  mockReplace.mockReset();
});

afterEach(() => {
  jest.restoreAllMocks();
});

test("shows access denied for non-contributor roles", () => {
  mockUseAuth.mockReturnValueOnce({ user: { role: "CURATOR" } });
  render(<ContributorDataPendingPage />);
  expect(screen.getByTestId("access-denied")).toBeInTheDocument();
});

test("shows loading indicator then empty state when no submissions", async () => {
  let resolveFetch: ((value: any) => void) | null = null;
  mockListContributorEvents.mockImplementation(
    () =>
      new Promise((res) => {
        resolveFetch = res;
      }),
  );

  render(<ContributorDataPendingPage />);

  expect(screen.getByText(/Memuat data kontribusi/i)).toBeInTheDocument();

  resolveFetch!([]);

  await waitFor(() =>
    expect(
      screen.queryByText(/Memuat data kontribusi/i),
    ).not.toBeInTheDocument(),
  );

  await waitFor(() =>
    expect(
      screen.getByText(/Kamu belum memiliki pengajuan/i),
    ).toBeInTheDocument(),
  );
});

test("fetchMine handles HttpError string detail, HttpError object detail, and generic Error", async () => {
  const { HttpError }: any = require("../../api/contributorEvents");

  // 1) HttpError with string detail
  const err1 = new HttpError("fail");
  err1.detail = "denied";
  mockListContributorEvents.mockRejectedValueOnce(err1);

  render(<ContributorDataPendingPage />);
  await waitFor(() => expect(screen.getByText(/denied/i)).toBeInTheDocument());

  // 2) HttpError with object detail
  mockListContributorEvents.mockReset();
  const err2 = new HttpError("fail");
  err2.detail = { message: "denied" };
  mockListContributorEvents.mockRejectedValueOnce(err2);

  render(<ContributorDataPendingPage />);
  await waitFor(() =>
    expect(
      screen.getByText(/Gagal memuat data kontribusi/i),
    ).toBeInTheDocument(),
  );

  // 3) Normal error
  mockListContributorEvents.mockReset();
  mockListContributorEvents.mockRejectedValueOnce(new Error("oops"));

  render(<ContributorDataPendingPage />);
  await waitFor(() =>
    expect(
      screen.getByText(/Gagal memuat data kontribusi/i),
    ).toBeInTheDocument(),
  );
});

test("formatDate shows '-' when created_at is missing", async () => {
  mockListContributorEvents.mockResolvedValueOnce([
    {
      id: "x",
      disease_name: "Flu",
      location: { city: "Bandung" },
      state: "PENDING",
    },
  ]);

  render(<ContributorDataPendingPage />);
  await waitFor(() => expect(mockListContributorEvents).toHaveBeenCalled());
  expect(screen.getByText("-")).toBeInTheDocument();
});

test("formatDate shows raw value when created_at is invalid", async () => {
  mockListContributorEvents.mockResolvedValueOnce([
    {
      id: "y",
      disease_name: "Flu",
      location: { city: "Jakarta" },
      state: "PENDING",
      created_at: "not-a-date",
    },
  ]);

  render(<ContributorDataPendingPage />);
  await waitFor(() => expect(mockListContributorEvents).toHaveBeenCalled());
  expect(screen.getByText("not-a-date")).toBeInTheDocument();
});

test("state pill class reflects PENDING / APPROVED / REJECTED", async () => {
  mockListContributorEvents.mockResolvedValueOnce([
    {
      id: "pending-1",
      disease_name: "Flu",
      location: { city: "Jakarta" },
      state: "PENDING",
    },
    {
      id: "approved-1",
      disease_name: "DBD",
      location: { city: "Bandung" },
      state: "APPROVED",
    },
    {
      id: "rejected-1",
      disease_name: "COVID-19",
      location: { city: "Medan" },
      state: "REJECTED",
    },
  ]);

  render(<ContributorDataPendingPage />);

  // tunggu sampai rows kebentuk (pakai ID row)
  await screen.findByText("pending-1");
  await screen.findByText("approved-1");
  await screen.findByText("rejected-1");

  const pendingRow = screen.getByText("pending-1").closest("tr") as HTMLElement;
  const approvedRow = screen
    .getByText("approved-1")
    .closest("tr") as HTMLElement;
  const rejectedRow = screen
    .getByText("rejected-1")
    .closest("tr") as HTMLElement;

  const pendingPill = pendingRow.querySelector("span") as HTMLElement;
  const approvedPill = approvedRow.querySelector("span") as HTMLElement;
  const rejectedPill = rejectedRow.querySelector("span") as HTMLElement;

  expect(pendingPill).toHaveTextContent("PENDING");
  expect(approvedPill).toHaveTextContent("APPROVED");
  expect(rejectedPill).toHaveTextContent("REJECTED");

  expect(pendingPill.className).toContain("bg-amber-100");
  expect(approvedPill.className).toContain("bg-green-100");
  expect(rejectedPill.className).toContain("bg-red-100");
});

test("view modal shows full news detail and can be closed", async () => {
  mockListContributorEvents.mockResolvedValueOnce([
    {
      id: "view-1",
      disease_name: "Flu",
      location: { city: "Jakarta", province: "DKI" },
      gender: "Laki-laki",
      age: 25,
      severity: "Sedang",
      status: "TERKONFIRMASI",
      state: "APPROVED",
      created_at: "2025-01-01T00:00:00Z",
      news: {
        title: "Judul Berita",
        portal: "Portal Kesehatan",
        type: "Artikel",
        author: "Reporter Kesehatan",
        date_published: "not-a-valid-date",
        url: "https://example.com/berita",
        img_url: "https://example.com/img.jpg",
        content: "Isi berita lengkap di sini.",
      },
    },
  ]);

  render(<ContributorDataPendingPage />);

  // tunggu tombol Lihat muncul di row
  const viewButton = await screen.findByRole("button", { name: /Lihat/i });
  fireEvent.click(viewButton);

  // judul berita muncul minimal sekali (bisa di table + modal)
  const titleEls = await screen.findAllByText(/Judul Berita/i);
  expect(titleEls.length).toBeGreaterThanOrEqual(1);

  // info lain yang khas di modal
  await screen.findByText(/Portal Kesehatan - Artikel/i);
  await screen.findByText(/Penulis: Reporter Kesehatan/i);
  await screen.findByText(/Isi berita lengkap di sini/i);
  await screen.findByText(/Gambar:/i);

  // Link sumber berita muncul dan href-nya benar
  const link = await screen.findByRole("link", {
    name: /example\.com\/berita/i,
  });
  expect(link).toHaveAttribute("href", "https://example.com/berita");

  // Tutup modal
  fireEvent.click(screen.getByRole("button", { name: /Tutup/i }));

  // pastikan modal hilang
  await waitFor(() =>
    expect(screen.queryByText(/Portal Kesehatan - Artikel/i)).not.toBeInTheDocument(),
  );
});



test("clicking Edit on pending row redirects correctly", async () => {
  mockListContributorEvents.mockResolvedValueOnce([
    {
      id: "abc-123",
      disease_name: "Flu",
      location: { city: "Jakarta" },
      state: "PENDING",
    },
  ]);

  render(<ContributorDataPendingPage />);

  // tunggu sampai tombol Edit muncul
  const editButton = await screen.findByRole("button", { name: /Edit/i });
  fireEvent.click(editButton);

  expect(mockPush).toHaveBeenCalledWith(
    "/contributor-edit-delete-data?id=abc-123",
  );
});

test("delete is not called when user cancels confirm dialog", async () => {
  mockListContributorEvents.mockResolvedValueOnce([
    {
      id: "abc-123",
      disease_name: "Flu",
      location: { city: "Jakarta" },
      state: "PENDING",
    },
  ]);

  jest.spyOn(window, "confirm").mockImplementation(() => false);

  render(<ContributorDataPendingPage />);

  const deleteButton = await screen.findByRole("button", { name: /Hapus/i });
  fireEvent.click(deleteButton);

  expect(mockDeleteContributorEvent).not.toHaveBeenCalled();
});

test("successful delete calls API and refetches", async () => {
  mockListContributorEvents.mockResolvedValueOnce([
    {
      id: "abc-123",
      disease_name: "Flu",
      location: { city: "Jakarta" },
      state: "PENDING",
    },
  ]);

  jest.spyOn(window, "confirm").mockImplementation(() => true);
  mockDeleteContributorEvent.mockResolvedValueOnce(undefined);
  mockListContributorEvents.mockResolvedValueOnce([]);

  render(<ContributorDataPendingPage />);

  const deleteButton = await screen.findByRole("button", { name: /Hapus/i });
  fireEvent.click(deleteButton);

  await waitFor(() =>
    expect(mockDeleteContributorEvent).toHaveBeenCalledWith("abc-123"),
  );

  await waitFor(() =>
    expect(mockListContributorEvents).toHaveBeenCalledTimes(2),
  );
});

test("delete generic error shows fallback message", async () => {
  mockListContributorEvents.mockResolvedValueOnce([
    {
      id: "abc-123",
      disease_name: "Flu",
      location: { city: "Jakarta" },
      state: "PENDING",
    },
  ]);

  jest.spyOn(window, "confirm").mockImplementation(() => true);
  mockDeleteContributorEvent.mockRejectedValueOnce(new Error("boom"));

  render(<ContributorDataPendingPage />);

  const deleteButton = await screen.findByRole("button", { name: /Hapus/i });
  fireEvent.click(deleteButton);

  await waitFor(() =>
    expect(
      screen.getByText(/Gagal menghapus pengajuan/i),
    ).toBeInTheDocument(),
  );
});

/**
 * EXTRA TESTS to increase coverage
 */

test("reload button calls fetchMine again and shows updated data", async () => {
  // 1st call: empty → empty state
  mockListContributorEvents
    .mockResolvedValueOnce([]) // initial useEffect
    .mockResolvedValueOnce([
      {
        id: "after-reload-1",
        disease_name: "DBD",
        location: { city: "Surabaya" },
        state: "PENDING",
      },
    ]); // after click "Muat ulang"

  render(<ContributorDataPendingPage />);

  await screen.findByText(/Kamu belum memiliki pengajuan/i);

  fireEvent.click(screen.getByRole("button", { name: /Muat ulang/i }));

  await screen.findByText("after-reload-1");
});

test("delete HttpError with string detail shows that detail", async () => {
  const { HttpError }: any = require("../../api/contributorEvents");

  mockListContributorEvents.mockResolvedValueOnce([
    {
      id: "abc-123",
      disease_name: "Flu",
      location: { city: "Jakarta" },
      state: "PENDING",
    },
  ]);

  jest.spyOn(window, "confirm").mockImplementation(() => true);

  const err = new HttpError("fail");
  err.detail = "detail-string-error";
  mockDeleteContributorEvent.mockRejectedValueOnce(err);

  render(<ContributorDataPendingPage />);

  const deleteButton = await screen.findByRole("button", { name: /Hapus/i });
  fireEvent.click(deleteButton);

  await waitFor(() =>
    expect(
      screen.getByText(/detail-string-error/i),
    ).toBeInTheDocument(),
  );
});

test("delete HttpError with object detail.detail shows nested detail", async () => {
  const { HttpError }: any = require("../../api/contributorEvents");

  mockListContributorEvents.mockResolvedValueOnce([
    {
      id: "abc-123",
      disease_name: "Flu",
      location: { city: "Jakarta" },
      state: "PENDING",
    },
  ]);

  jest.spyOn(window, "confirm").mockImplementation(() => true);

  const err = new HttpError("fail");
  err.detail = { detail: "nested-detail-error" };
  mockDeleteContributorEvent.mockRejectedValueOnce(err);

  render(<ContributorDataPendingPage />);

  const deleteButton = await screen.findByRole("button", { name: /Hapus/i });
  fireEvent.click(deleteButton);

  await waitFor(() =>
    expect(
      screen.getByText(/nested-detail-error/i),
    ).toBeInTheDocument(),
  );
});

test("modal close button executes setViewItem(null) and unmounts modal", async () => {
  mockListContributorEvents.mockResolvedValueOnce([
    {
      id: "modal-test",
      disease_name: "Flu",
      location: { city: "Bandung" },
      state: "PENDING",
    },
  ]);

  render(<ContributorDataPendingPage />);

  const viewButton = await screen.findByRole("button", { name: /Lihat/i });
  fireEvent.click(viewButton);

  // pastikan modal ada — pakai teks unik yang cuma muncul di modal
  await screen.findByText("Jenis kelamin");

  // klik tombol Tutup
  fireEvent.click(screen.getByRole("button", { name: "Tutup" }));

  // pastikan modal hilang
  await waitFor(() =>
    expect(screen.queryByText("Jenis kelamin")).not.toBeInTheDocument(),
  );
});

test("Edit button click calls handleEdit only when pending", async () => {
  mockListContributorEvents.mockResolvedValueOnce([
    {
      id: "edit-test",
      disease_name: "Flu",
      location: { city: "Bandung" },
      state: "PENDING",
    },
  ]);

  render(<ContributorDataPendingPage />);

  const editButton = await screen.findByRole("button", { name: /Edit/i });
  fireEvent.click(editButton);

  expect(mockPush).toHaveBeenCalledWith(
    "/contributor-edit-delete-data?id=edit-test",
  );
});

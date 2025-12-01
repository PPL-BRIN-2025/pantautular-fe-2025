import "@testing-library/jest-dom";
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { act } from "react";
import ContributionManagementPage from "../../app/contribution-management/page";

// Mock components
jest.mock("../../app/components/Navbar", () => () => <div data-testid="navbar" />);
jest.mock("../../app/components/Footer", () => () => <div data-testid="footer" />);
jest.mock("../../app/components/AccessDenied", () => () => (
  <div data-testid="access-denied">Akses Ditolak</div>
));

// Mock auth
jest.mock("../../app/auth/hooks/useAuth", () => ({
  useAuth: jest.fn(),
}));

jest.mock("../../api/contributorEvents", () => ({
  listContributorEvents: jest.fn(),
  reviewContributorEvent: jest.fn(),
  HttpError: class HttpError extends Error {
    detail: any;
    constructor(detail: any) {
      super("HttpError");
      this.detail = detail;
    }
  },
}));

import { useAuth } from "../../app/auth/hooks/useAuth";
import {
  listContributorEvents,
  reviewContributorEvent,
  HttpError,
} from "../../api/contributorEvents";

const mockUseAuth = useAuth as jest.Mock;

// Helper items
const baseItem = {
  id: "123",
  created_at: "2025-12-01T10:00:00Z",
  created_by: { name: "John Doe", email: "john@test.com" },
  disease_name: "Campak",
  state: "PENDING",
};

describe("ContributionManagementPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // --------------------------------------------------------------------
  // 1. ACCESS DENIED
  // --------------------------------------------------------------------
  test("renders AccessDenied when user has no permission", () => {
    mockUseAuth.mockReturnValue({ user: { role: "CONTRIBUTOR" } });

    render(<ContributionManagementPage />);
    expect(screen.getByTestId("access-denied")).toBeInTheDocument();
  });

  // --------------------------------------------------------------------
  // 1b. normalizeRole edge cases
  // --------------------------------------------------------------------
  test("normalizeRole handles undefined", async () => {
    mockUseAuth.mockReturnValue({ user: { role: undefined } });
    (listContributorEvents as jest.Mock).mockResolvedValue([]);

    render(<ContributionManagementPage />);
    expect(screen.getByTestId("access-denied")).toBeInTheDocument();
  });

  test("normalizeRole trims and uppercases", async () => {
    mockUseAuth.mockReturnValue({ user: { role: "   curator  " } });
    (listContributorEvents as jest.Mock).mockResolvedValue([]);

    render(<ContributionManagementPage />);
    await waitFor(() =>
      expect(screen.getByText(/Tidak ada pengajuan/)).toBeInTheDocument()
    );
  });

  // --------------------------------------------------------------------
  // 2. LOADING STATE
  // --------------------------------------------------------------------
  test("shows loading state", () => {
    mockUseAuth.mockReturnValue({ user: { role: "CURATOR" } });
    (listContributorEvents as jest.Mock).mockImplementation(
      () => new Promise(() => {})
    );

    render(<ContributionManagementPage />);
    expect(screen.getByText(/Memuat data kontribusi/)).toBeInTheDocument();
  });

  // --------------------------------------------------------------------
  // 3. EMPTY STATE
  // --------------------------------------------------------------------
  test("shows empty state", async () => {
    mockUseAuth.mockReturnValue({ user: { role: "CURATOR" } });
    (listContributorEvents as jest.Mock).mockResolvedValue([]);

    render(<ContributionManagementPage />);
    await waitFor(() =>
      expect(screen.getByText(/Tidak ada pengajuan/)).toBeInTheDocument()
    );
  });

  test("gracefully handles non-array API responses", async () => {
    mockUseAuth.mockReturnValue({ user: { role: "CURATOR" } });
    (listContributorEvents as jest.Mock).mockResolvedValue({ not: "array" });

    render(<ContributionManagementPage />);
    await waitFor(() =>
      expect(screen.getByText(/Tidak ada pengajuan/)).toBeInTheDocument()
    );
  });

  // --------------------------------------------------------------------
  // 3b. titleFor fallback
  // --------------------------------------------------------------------
  test("titleFor → 'Tanpa judul' fallback", async () => {
    mockUseAuth.mockReturnValue({ user: { role: "ADMIN" } });
    (listContributorEvents as jest.Mock).mockResolvedValue([
      { id: "X1", created_at: "", created_by: {}, state: "PENDING" },
    ]);

    render(<ContributionManagementPage />);
    await waitFor(() =>
      expect(screen.getByText("Tanpa judul")).toBeInTheDocument()
    );
  });

  // --------------------------------------------------------------------
  // 4. TABLE HEADERS
  // --------------------------------------------------------------------
  test("table headers render correctly", async () => {
    mockUseAuth.mockReturnValue({ user: { role: "ADMIN" } });
    (listContributorEvents as jest.Mock).mockResolvedValue([baseItem]);

    render(<ContributionManagementPage />);
    await waitFor(() => screen.getByText("123")); // ensure table loaded

    expect(screen.getByText("ID")).toBeInTheDocument();
    expect(screen.getByText("Judul")).toBeInTheDocument();
    expect(screen.getByText("Dibuat")).toBeInTheDocument();
    expect(screen.getByText("Dikumpulkan oleh")).toBeInTheDocument();
    expect(screen.getByText("Status")).toBeInTheDocument();
    expect(screen.getByText("Aksi")).toBeInTheDocument();
  });


  // --------------------------------------------------------------------
  // 4b. statePillClass logic coverage
  // --------------------------------------------------------------------
  test("renders APPROVED state pill", async () => {
    mockUseAuth.mockReturnValue({ user: { role: "ADMIN" } });

    (listContributorEvents as jest.Mock).mockResolvedValue([
      { ...baseItem, state: "APPROVED" },
    ]);

    render(<ContributionManagementPage />);
    await waitFor(() => screen.getByText("APPROVED"));
  });

  test("renders REJECTED state pill", async () => {
    mockUseAuth.mockReturnValue({ user: { role: "ADMIN" } });

    (listContributorEvents as jest.Mock).mockResolvedValue([
      { ...baseItem, state: "REJECTED" },
    ]);

    render(<ContributionManagementPage />);
    await waitFor(() => screen.getByText("REJECTED"));
  });

  test("renders default PENDING state pill", async () => {
    mockUseAuth.mockReturnValue({ user: { role: "ADMIN" } });

    (listContributorEvents as jest.Mock).mockResolvedValue([
      { ...baseItem, state: null },
    ]);

    render(<ContributionManagementPage />);
    await waitFor(() => screen.getByText("PENDING"));
  });

  // --------------------------------------------------------------------
  // 5. VIEW MODAL (full + minimal)
  // --------------------------------------------------------------------
  test("opens & closes view modal (with full data)", async () => {
    mockUseAuth.mockReturnValue({ user: { role: "ADMIN" } });
    (listContributorEvents as jest.Mock).mockResolvedValue([baseItem]);

    render(<ContributionManagementPage />);
    await waitFor(() => screen.getByText("123"));

    fireEvent.click(screen.getByRole("button", { name: "Lihat" }));
    expect(await screen.findByText("ID: 123")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Tutup" }));
    await waitFor(() =>
      expect(screen.queryByRole("button", { name: "Tutup" })).not.toBeInTheDocument()
    );
  });

  test("view modal handles missing news & missing review_note", async () => {
    mockUseAuth.mockReturnValue({ user: { role: "ADMIN" } });

    (listContributorEvents as jest.Mock).mockResolvedValue([
      { ...baseItem, news: null, review_note: null },
    ]);

    render(<ContributionManagementPage />);
    await waitFor(() => screen.getByText("123"));

    fireEvent.click(screen.getByText("Lihat"));
    expect(screen.getByText("Tidak ada data sumber.")).toBeInTheDocument();
  });

  // --------------------------------------------------------------------
  // 6. APPROVE
  // --------------------------------------------------------------------
  test("approve flow works", async () => {
    mockUseAuth.mockReturnValue({ user: { role: "CURATOR" } });
    (listContributorEvents as jest.Mock).mockResolvedValue([baseItem]);
    (reviewContributorEvent as jest.Mock).mockResolvedValue({});

    render(<ContributionManagementPage />);
    await waitFor(() => screen.getByText("123"));

    fireEvent.click(screen.getByRole("button", { name: "Terima" })); // open modal
    const [, confirmApprove] = await screen.findAllByRole("button", {
      name: "Terima",
    });
    fireEvent.click(confirmApprove);

    await waitFor(() => expect(reviewContributorEvent).toHaveBeenCalled());
    expect(listContributorEvents).toHaveBeenCalledTimes(2);
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Tolak" })).not.toBeDisabled()
    );
  });

  // --------------------------------------------------------------------
  // 7. REJECT
  // --------------------------------------------------------------------
  test("reject requires note", async () => {
    mockUseAuth.mockReturnValue({ user: { role: "CURATOR" } });
    (listContributorEvents as jest.Mock).mockResolvedValue([baseItem]);

    render(<ContributionManagementPage />);
    await waitFor(() => screen.getByText("123"));

    fireEvent.click(screen.getByRole("button", { name: "Tolak" })); // open modal
    const [, confirmReject] = await screen.findAllByRole("button", {
      name: "Tolak",
    });
    fireEvent.click(confirmReject); // confirm without note

    expect(
      screen.getByText("Catatan wajib diisi untuk penolakan.")
    ).toBeInTheDocument();
  });

  test("reject flow works when note is provided", async () => {
    mockUseAuth.mockReturnValue({ user: { role: "CURATOR" } });
    (listContributorEvents as jest.Mock).mockResolvedValue([baseItem]);
    (reviewContributorEvent as jest.Mock).mockResolvedValue({});

    render(<ContributionManagementPage />);
    await waitFor(() => screen.getByText("123"));

    fireEvent.click(screen.getByRole("button", { name: "Tolak" }));
    const [, confirmReject] = await screen.findAllByRole("button", {
      name: "Tolak",
    });
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "bad" } });
    fireEvent.click(confirmReject);

    expect(reviewContributorEvent).toHaveBeenCalledWith("123", "reject", "bad");
    await waitFor(() => expect(listContributorEvents).toHaveBeenCalledTimes(2));
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Terima" })).not.toBeDisabled()
    );
  });

  // --------------------------------------------------------------------
  // 8. ERROR STATES
  // --------------------------------------------------------------------
  test("generic error", async () => {
    mockUseAuth.mockReturnValue({ user: { role: "ADMIN" } });
    (listContributorEvents as jest.Mock).mockRejectedValue(new Error("x"));

    render(<ContributionManagementPage />);

    await waitFor(() =>
      expect(
        screen.getByText("Gagal memuat data kontribusi.")
      ).toBeInTheDocument()
    );
  });

  test("HttpError detail object", async () => {
    mockUseAuth.mockReturnValue({ user: { role: "ADMIN" } });
    (listContributorEvents as jest.Mock).mockRejectedValue(
      new HttpError({ detail: "Detail message" } as any)
    );

    render(<ContributionManagementPage />);
    await waitFor(() =>
      expect(
        screen.getByText("Gagal memuat data kontribusi. Pastikan Anda memiliki akses.")
      ).toBeInTheDocument()
    );
  });

  test("HttpError detail string uses provided message", async () => {
    mockUseAuth.mockReturnValue({ user: { role: "ADMIN" } });
    (listContributorEvents as jest.Mock).mockRejectedValue(
      new HttpError("Langsung pesan" as any)
    );

    render(<ContributionManagementPage />);
    await waitFor(() =>
      expect(screen.getByText("Langsung pesan")).toBeInTheDocument()
    );
  });

  // --------------------------------------------------------------------
  // 9. RELOAD BUTTON
  // --------------------------------------------------------------------
  test("reload button re-fetches", async () => {
    mockUseAuth.mockReturnValue({ user: { role: "ADMIN" } });

    const spy = (listContributorEvents as jest.Mock).mockResolvedValue([
      baseItem,
    ]);

    render(<ContributionManagementPage />);
    await waitFor(() => screen.getByText("123"));

    fireEvent.click(screen.getByText("Muat ulang"));
    expect(spy).toHaveBeenCalledTimes(2);
  });

  // --------------------------------------------------------------------
  // 10. Non-pending items disable action buttons
  // --------------------------------------------------------------------
  test("buttons disabled when state != PENDING", async () => {
    mockUseAuth.mockReturnValue({ user: { role: "ADMIN" } });

    (listContributorEvents as jest.Mock).mockResolvedValue([
      { ...baseItem, state: "APPROVED" },
    ]);

    render(<ContributionManagementPage />);
    await waitFor(() => screen.getByText("APPROVED"));

    expect(screen.getByText("Terima")).toBeDisabled();
    expect(screen.getByText("Tolak")).toBeDisabled();
  });

  // --------------------------------------------------------------------
  // 11. formatDate invalid + null
  // --------------------------------------------------------------------
  test("formatDate handles invalid date", async () => {
    mockUseAuth.mockReturnValue({ user: { role: "ADMIN" } });

    (listContributorEvents as jest.Mock).mockResolvedValue([
      { ...baseItem, created_at: "invalid-date" },
    ]);

    render(<ContributionManagementPage />);
    await waitFor(() =>
      expect(screen.getByText("invalid-date")).toBeInTheDocument()
    );
  });

  test("formatDate handles null date", async () => {
    mockUseAuth.mockReturnValue({ user: { role: "ADMIN" } });

    (listContributorEvents as jest.Mock).mockResolvedValue([
      { ...baseItem, created_at: null },
    ]);

    render(<ContributionManagementPage />);
    await waitFor(() => expect(screen.getByText("-")).toBeInTheDocument());
  });

  // --------------------------------------------------------------------
  // EXTRA TEST — fallback when disease missing
  // --------------------------------------------------------------------
  test("table renders correct fallback when disease_name missing", async () => {
    mockUseAuth.mockReturnValue({ user: { role: "ADMIN" } });

    (listContributorEvents as jest.Mock).mockResolvedValue([
      { ...baseItem, disease_name: null },
    ]);

    render(<ContributionManagementPage />);
    await waitFor(() => screen.getByText("123"));

    expect(screen.getByText("Tanpa judul")).toBeInTheDocument();
  });

  test("view modal handles location with only province", async () => {
    mockUseAuth.mockReturnValue({ user: { role: "ADMIN" } });

    (listContributorEvents as jest.Mock).mockResolvedValue([
      { ...baseItem, location: { city: null, province: "Jawa Barat" } },
    ]);

    render(<ContributionManagementPage />);
    await waitFor(() => screen.getByText("123"));

    fireEvent.click(screen.getByRole("button", { name: "Lihat" }));
    expect(screen.getByText(/Jawa Barat/)).toBeInTheDocument();
  });

  test("view modal handles missing gender, severity, status", async () => {
    mockUseAuth.mockReturnValue({ user: { role: "ADMIN" } });

    (listContributorEvents as jest.Mock).mockResolvedValue([
      {
        ...baseItem,
        disease_name: null,
        gender: null,
        severity: null,
        status: null,
      },
    ]);

    render(<ContributionManagementPage />);
    await waitFor(() => screen.getByText("123"));

    fireEvent.click(screen.getByRole("button", { name: "Lihat" }));

    expect(screen.getAllByText("-").length).toBeGreaterThan(0);
  });

  test("view modal shows review_note when present", async () => {
    mockUseAuth.mockReturnValue({ user: { role: "ADMIN" } });

    (listContributorEvents as jest.Mock).mockResolvedValue([
      {
        ...baseItem,
        review_note: "Sudah dicek dan valid",
      },
    ]);

    render(<ContributionManagementPage />);
    await waitFor(() => screen.getByText("123"));

    fireEvent.click(screen.getByRole("button", { name: "Lihat" }));
    expect(screen.getByText("Sudah dicek dan valid")).toBeInTheDocument();
  });

  test("view modal handles minimal news fields", async () => {
    mockUseAuth.mockReturnValue({ user: { role: "ADMIN" } });

    (listContributorEvents as jest.Mock).mockResolvedValue([
      {
        ...baseItem,
        news: {
          title: "Only Title",
          portal: null,
          type: null,
          author: null,
          date_published: null,
          url: null,
          img_url: null,
          content: null,
        },
      },
    ]);

    render(<ContributionManagementPage />);
    await waitFor(() => screen.getByText("123"));

    fireEvent.click(screen.getByRole("button", { name: "Lihat" }));
    expect(
      await screen.findByRole("heading", { name: "Only Title" })
    ).toBeInTheDocument();
  });

  test("view modal renders extended news & fallback fields", async () => {
    mockUseAuth.mockReturnValue({ user: { role: "ADMIN" } });

    (listContributorEvents as jest.Mock).mockResolvedValue([
      {
        ...baseItem,
        state: null,
        created_by: { name: "Jane" }, // no email branch
        news: {
          title: "",
          portal: "Portal X",
          type: "Type Y",
          author: "Author Z",
          date_published: "2025-01-01T00:00:00Z",
          url: "https://example.com/news",
          img_url: "https://example.com/img.png",
          content: "Konten lengkap",
        },
      },
    ]);

    render(<ContributionManagementPage />);
    await waitFor(() => screen.getByText("123"));

    fireEvent.click(screen.getByRole("button", { name: "Lihat" }));
    expect(screen.getAllByText("PENDING").length).toBeGreaterThan(0); // state fallback
    expect(screen.queryByText("(john@test.com)")).not.toBeInTheDocument();
    expect(screen.getByText("Portal X - Type Y")).toBeInTheDocument();
    expect(screen.getByText("https://example.com/news")).toBeInTheDocument();
    expect(screen.getByText(/Gambar:/)).toBeInTheDocument();
    expect(screen.getByText("Konten lengkap")).toBeInTheDocument();
  });

  test("error banner shown when reviewContributorEvent fails", async () => {
    mockUseAuth.mockReturnValue({ user: { role: "CURATOR" } });
    (listContributorEvents as jest.Mock).mockResolvedValue([baseItem]);
    (reviewContributorEvent as jest.Mock).mockRejectedValue(new Error("Fail"));

    render(<ContributionManagementPage />);
    await waitFor(() => screen.getByText("123"));

    fireEvent.click(screen.getByRole("button", { name: "Terima" }));
    const [, confirmApprove] = await screen.findAllByRole("button", {
      name: "Terima",
    });
    fireEvent.click(confirmApprove);

    await waitFor(() =>
      expect(screen.getByText("Gagal memproses tindakan.")).toBeInTheDocument()
    );
  });

  test("cancel button closes action modal", async () => {
    mockUseAuth.mockReturnValue({ user: { role: "CURATOR" } });
    (listContributorEvents as jest.Mock).mockResolvedValue([baseItem]);

    render(<ContributionManagementPage />);
    await waitFor(() => screen.getByText("123"));

    fireEvent.click(screen.getByRole("button", { name: "Terima" }));
    expect(screen.getByText("Terima Pengajuan")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Batal"));
    await waitFor(() =>
      expect(screen.queryByText("Terima Pengajuan")).not.toBeInTheDocument()
    );
  });

  test("approve button is disabled and shows 'Memproses...' when acting=true", async () => {
    mockUseAuth.mockReturnValue({ user: { role: "CURATOR" } });

    (listContributorEvents as jest.Mock).mockResolvedValue([baseItem]);
    (reviewContributorEvent as jest.Mock).mockImplementation(
      () => new Promise(() => {}) // keeps acting=true forever
    );

    render(<ContributionManagementPage />);
    await waitFor(() => screen.getByText("123"));

    fireEvent.click(screen.getByRole("button", { name: "Terima" })); // open modal
    const [, confirmApprove] = await screen.findAllByRole("button", {
      name: "Terima",
    });
    fireEvent.click(confirmApprove); // triggers acting=true

    const processingBtn = await screen.findByText("Memproses...");
    expect(processingBtn).toBeDisabled();
  });
});

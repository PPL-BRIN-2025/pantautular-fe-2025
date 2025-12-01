import "@testing-library/jest-dom";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
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

// Helper: fake submission items
const mockItems = [
  {
    id: "123",
    state: "PENDING",
    created_at: "2025-12-01T10:00:00Z",
    disease_name: "Campak",
    created_by: { name: "John Doe", email: "john@test.com" },
  },
];

describe("ContributionManagementPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // --------------------------------------------------------
  // 1. ACCESS DENIED
  // --------------------------------------------------------
  test("renders AccessDenied page when user has no permission", () => {
    mockUseAuth.mockReturnValue({ user: { role: "CONTRIBUTOR" } });

    render(<ContributionManagementPage />);
    expect(screen.getByTestId("access-denied")).toBeInTheDocument();
  });

  // --------------------------------------------------------
  // 2. LOADING STATE
  // --------------------------------------------------------
  test("shows loading state while fetching", async () => {
    mockUseAuth.mockReturnValue({ user: { role: "CURATOR" } });
    (listContributorEvents as jest.Mock).mockImplementation(
      () => new Promise(() => {}) // never resolve (loading)
    );

    render(<ContributionManagementPage />);
    expect(screen.getByText(/Memuat data kontribusi/)).toBeInTheDocument();
  });

  // --------------------------------------------------------
  // 3. EMPTY STATE
  // --------------------------------------------------------
  test("shows empty state when no submissions", async () => {
    mockUseAuth.mockReturnValue({ user: { role: "CURATOR" } });
    (listContributorEvents as jest.Mock).mockResolvedValue([]);

    render(<ContributionManagementPage />);

    await waitFor(() =>
      expect(screen.getByText(/Tidak ada pengajuan/)).toBeInTheDocument()
    );
  });

  // --------------------------------------------------------
  // 4. TABLE RENDER
  // --------------------------------------------------------
  test("renders submission table", async () => {
    mockUseAuth.mockReturnValue({ user: { role: "ADMIN" } });
    (listContributorEvents as jest.Mock).mockResolvedValue(mockItems);

    render(<ContributionManagementPage />);

    await waitFor(() =>
      expect(screen.getByText("123")).toBeInTheDocument()
    );

    expect(screen.getByText("Campak")).toBeInTheDocument();
    expect(screen.getByText("John Doe")).toBeInTheDocument();
  });

  // --------------------------------------------------------
  // 5. VIEW MODAL
  // --------------------------------------------------------
  test("opens and closes view detail modal", async () => {
    mockUseAuth.mockReturnValue({ user: { role: "ADMIN" } });
    (listContributorEvents as jest.Mock).mockResolvedValue(mockItems);

    render(<ContributionManagementPage />);
    await waitFor(() => screen.getByText("123"));

    fireEvent.click(screen.getByText("Lihat"));
    expect(screen.getByText(/Penyakit/)).toBeInTheDocument();

    fireEvent.click(screen.getByText("Tutup"));
    await waitFor(() =>
      expect(screen.queryByText(/Penyakit/)).not.toBeInTheDocument()
    );
  });

  // --------------------------------------------------------
  // 6. APPROVE MODAL FLOW
  // --------------------------------------------------------
  test("approve action works", async () => {
    mockUseAuth.mockReturnValue({ user: { role: "CURATOR" } });
    (listContributorEvents as jest.Mock).mockResolvedValue(mockItems);
    (reviewContributorEvent as jest.Mock).mockResolvedValue({});

    render(<ContributionManagementPage />);
    await waitFor(() => screen.getByText("123"));

    fireEvent.click(screen.getByText("Terima"));
    expect(screen.getByText("Terima Pengajuan")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Terima"));

    await waitFor(() =>
      expect(
        screen.getByText(/Pengajuan berhasil diterima/i)
      ).toBeInTheDocument()
    );
  });

  // --------------------------------------------------------
  // 7. REJECT MODAL (requires note)
  // --------------------------------------------------------
  test("reject action requires a note", async () => {
    mockUseAuth.mockReturnValue({ user: { role: "CURATOR" } });
    (listContributorEvents as jest.Mock).mockResolvedValue(mockItems);

    render(<ContributionManagementPage />);
    await waitFor(() => screen.getByText("123"));

    fireEvent.click(screen.getByText("Tolak"));
    expect(screen.getByText("Tolak Pengajuan")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Tolak")); // without note

    expect(
      screen.getByText("Catatan wajib diisi untuk penolakan.")
    ).toBeInTheDocument();
  });

  // --------------------------------------------------------
  // 8. ERROR STATE WHEN API FAILS
  // --------------------------------------------------------
  test("shows error when API fails", async () => {
    mockUseAuth.mockReturnValue({ user: { role: "ADMIN" } });
    (listContributorEvents as jest.Mock).mockRejectedValue(
      new (HttpError as any)("mock API fail")
    );    

    render(<ContributionManagementPage />);

    await waitFor(() =>
      expect(
        screen.getByText(/Gagal memuat data kontribusi/)
      ).toBeInTheDocument()
    );
  });

  // --------------------------------------------------------
  // 9. RELOAD BUTTON
  // --------------------------------------------------------
  test("reload button calls fetchSubmissions", async () => {
    mockUseAuth.mockReturnValue({ user: { role: "ADMIN" } });
    const spy = (listContributorEvents as jest.Mock).mockResolvedValue(mockItems);

    render(<ContributionManagementPage />);
    await waitFor(() => screen.getByText("123"));

    fireEvent.click(screen.getByText("Muat ulang"));
    expect(spy).toHaveBeenCalledTimes(2); // initial + reload
  });
});

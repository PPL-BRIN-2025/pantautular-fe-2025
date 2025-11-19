import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import ExpertDashboardPage, {
  normalizeRole,
} from "../../app/expert-dashboard/ExpertDashboardPage";

const mockReplace = jest.fn();
const mockPush = jest.fn();
const mockUsePathname = jest.fn(() => "/expert-dashboard");

const mockInformationSection = jest.fn((props: any) => (
  <div>
    <div>Konten Informasi Ahli</div>
    {props?.marker ?? null}
  </div>
));

jest.mock("next/navigation", () => ({
  __esModule: true,
  useRouter: () => ({ replace: mockReplace, push: mockPush }),
  usePathname: () => mockUsePathname(),
}));

const mockUseAuth = jest.fn();

jest.mock("../../app/auth/hooks/useAuth", () => ({
  useAuth: () => mockUseAuth(),
}));

jest.mock("../../app/components/Navbar", () => ({
  __esModule: true,
  default: () => <nav>Navbar</nav>,
}));

jest.mock("../../app/components/dashboard/FilterSection", () => ({
  __esModule: true,
  default: (props: any) => (
    <div>
      <div>Filter Informasi Penyakit Menular</div>
      <button
        type="button"
        onClick={() =>
          props?.onSubmitFilterState?.({
            diseases: [{ value: "dbd" }],
            locations: {
              provinces: [{ value: "Jawa Barat" }],
              cities: [{ value: "Depok" }],
            },
            portals: [{ value: "Portal" }],
            level_of_alertness: 2,
            start_date: "2025-01-01",
            end_date: "2025-01-07",
            batch: { value: "B-1" },
          })
        }
      >
        Terapkan Filter
      </button>
      <button
        type="button"
        onClick={() => props?.onError?.("Filter failed")}
      >
        Trigger Error
      </button>
      <button
        type="button"
        onClick={() =>
          props?.onSubmitFilterState?.({
            diseases: [],
            locations: { provinces: undefined, cities: undefined },
            portals: [],
            level_of_alertness: 0,
            start_date: null,
            end_date: null,
            batch: undefined,
          })
        }
      >
        Submit Kosong
      </button>
    </div>
  ),
}));

jest.mock("../../app/components/dashboard/InformationSection", () => ({
  __esModule: true,
  default: (props: any) => mockInformationSection(props),
}));

jest.mock("../../app/expert-dashboard/_components/AccessDenied", () => ({
  __esModule: true,
  default: () => <div>Akses Ditolak</div>,
}));

describe("ExpertDashboardPage", () => {
  beforeEach(() => {
    mockReplace.mockReset();
    mockPush.mockReset();
    mockUseAuth.mockReset();
    mockUsePathname.mockReturnValue("/expert-dashboard");
    mockInformationSection.mockClear();
    window.localStorage.clear();
  });

  it("renders dashboard content for EXP_USER role with CSV enabled", async () => {
    mockUseAuth.mockReturnValue({
      user: { id: 3, email: "exp@mail.com", name: "Explorer", role: "EXP_USER" },
      logout: jest.fn(),
    });

    render(<ExpertDashboardPage />);

    const filterHeadings = await screen.findAllByText(/Filter Informasi Penyakit Menular/i);
    expect(filterHeadings.length).toBeGreaterThan(0);
    expect(mockInformationSection).toHaveBeenCalled();
    expect(mockInformationSection.mock.calls[0][0]).toMatchObject({ showExcelView: true });
    expect(screen.queryByText("Akses Ditolak")).not.toBeInTheDocument();
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it("allows ADMIN role access", async () => {
    mockUseAuth.mockReturnValue({
      user: { id: 1, email: "admin@mail.com", name: "Admin", role: "ADMIN" },
      logout: jest.fn(),
    });

    render(<ExpertDashboardPage />);

    const filterHeadings = await screen.findAllByText(/Filter Informasi Penyakit Menular/i);
    expect(filterHeadings.length).toBeGreaterThan(0);
    expect(mockInformationSection).toHaveBeenCalled();
    expect(mockInformationSection.mock.calls[0][0]).toMatchObject({ showExcelView: true });
    expect(screen.queryByText("Akses Ditolak")).not.toBeInTheDocument();
  });

  it("redirects to login when no user is available", async () => {
    mockUseAuth.mockReturnValue({
      user: null,
      logout: jest.fn(),
    });

    render(<ExpertDashboardPage />);

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith("/login?next=%2Fexpert-dashboard");
    });

    expect(screen.getByText(/Memeriksa akses/i)).toBeInTheDocument();
  });

  it("shows access denied notice for unsupported role", async () => {
    mockUseAuth.mockReturnValue({
      user: { id: 4, email: "user@mail.com", name: "User", role: "CURATOR" },
      logout: jest.fn(),
    });

    render(<ExpertDashboardPage />);

    await waitFor(() => {
      expect(screen.getByText("Akses Ditolak")).toBeInTheDocument();
    });
  });

  it("logs warning when stored user JSON is invalid", async () => {
    const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
    window.localStorage.setItem("user", "{ not-json");
    mockUseAuth.mockReturnValue({
      user: null,
      logout: jest.fn(),
    });

    render(<ExpertDashboardPage />);

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith("/login?next=%2Fexpert-dashboard");
    });
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  it("converts submitted filters into flat props for InformationSection", async () => {
    mockUseAuth.mockReturnValue({
      user: { id: 6, email: "exp@mail.com", name: "Explorer", role: "EXP_USER" },
      logout: jest.fn(),
    });

    const user = userEvent.setup();
    render(<ExpertDashboardPage />);

    await user.click(screen.getByText("Terapkan Filter"));

    await waitFor(() => expect(mockInformationSection).toHaveBeenCalledTimes(2));
    const latestProps = mockInformationSection.mock.calls.at(-1)?.[0];
    expect(latestProps?.filterState).toMatchObject({
      level_of_alertness: 2,
      start_date: "2025-01-01",
      end_date: "2025-01-07",
      batch: { value: "B-1" },
    });
    expect(latestProps?.filterState?.locations).toHaveLength(2);
  });

  it("logs filter errors via handleError", async () => {
    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    mockUseAuth.mockReturnValue({
      user: { id: 7, email: "exp@mail.com", name: "Explorer", role: "EXP_USER" },
      logout: jest.fn(),
    });

    const user = userEvent.setup();
    render(<ExpertDashboardPage />);

    await user.click(screen.getByText("Trigger Error"));
    expect(consoleSpy).toHaveBeenCalledWith("Filter failed");
    consoleSpy.mockRestore();
  });

  it("submits filters when locations and batch are missing", async () => {
    mockUseAuth.mockReturnValue({
      user: { id: 8, email: "exp@mail.com", name: "Explorer", role: "EXP_USER" },
      logout: jest.fn(),
    });
    const user = userEvent.setup();

    render(<ExpertDashboardPage />);
    await user.click(screen.getByText("Submit Kosong"));

    await waitFor(() => expect(mockInformationSection).toHaveBeenCalledTimes(2));
    const latestProps = mockInformationSection.mock.calls.at(-1)?.[0];
    expect(latestProps?.filterState?.locations).toEqual([]);
    expect(latestProps?.filterState?.batch).toBeNull();
  });

  it("normalizes roles helper", () => {
    expect(normalizeRole(" admin ")).toBe("ADMIN");
    expect(normalizeRole(undefined)).toBe("");
  });
});

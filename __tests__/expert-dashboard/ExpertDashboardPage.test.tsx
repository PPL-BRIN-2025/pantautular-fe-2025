import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import ExpertDashboardPage from "../../app/expert-dashboard/ExpertDashboardPage";

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
            diseases: [],
            locations: { provinces: [], cities: [] },
            portals: [],
            level_of_alertness: 0,
            start_date: null,
            end_date: null,
            batch: null,
          })
        }
      >
        Terapkan Filter
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
});

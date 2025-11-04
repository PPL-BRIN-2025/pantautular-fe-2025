import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import CuratorDashboardPage from "../../app/curator-dashboard/page";

const mockReplace = jest.fn();
const mockPush = jest.fn();
const mockUsePathname = jest.fn(() => "/curator-dashboard");
const mockUseDashboardData = jest.fn(() => ({
  data: {
    prevalence_statistics: { prevalence: 10, year: 2025, population: 1000 },
    severity_statistics: {
      total_cases: 5,
      severity_counts: { mortalitas: 1, insiden: 3, hospitalisasi: 1 },
    },
    age_statistics: { under_12: 1, "12_25": 2, "26_45": 1, above_45: 1 },
    gender_statistics: { male: 3, female: 2 },
    severity_dates_count_statistics: {},
    national_news_statistics: { top_national: [], all_national: [] },
    local_portal_statistics: { top_local: [], all_local: [] },
    healthcare_news_statistics: { top_healthcare: [], all_healthcare: [] },
  },
  isLoading: false,
  error: null,
}));

const mockInformationSection = jest.fn(({ userRole }: { userRole?: string | null }) => (
  <div>
    <div>Filter Informasi Penyakit Menular</div>
    {userRole?.toUpperCase() === "EXP_USER" && <div>Visualisasi Excel</div>}
  </div>
));

jest.mock("next/image", () => ({
  __esModule: true,
  default: (props: any) => {
    const { src, alt, ...rest } = props;
    return <img src={src} alt={alt} {...rest} />;
  },
}));

jest.mock("next/navigation", () => ({
  __esModule: true,
  useRouter: () => ({ replace: mockReplace, push: mockPush }),
  usePathname: () => mockUsePathname(),
}));

const mockUseAuth = jest.fn();

jest.mock("../../app/auth/hooks/useAuth", () => ({
  useAuth: () => mockUseAuth(),
}));

jest.mock("../../hooks/useDashboardData", () => ({
  useDashboardData: () => mockUseDashboardData(),
}));

jest.mock("../../app/components/dashboard/InformationSection", () => ({
  __esModule: true,
  default: (props: any) => mockInformationSection(props),
}));

jest.mock("../../app/components/dashboard/FilterSection", () => ({
  __esModule: true,
  default: (props: any) => (
    <div>
      <div>Filter Informasi Penyakit Menular</div>
      <button type="button" onClick={() => props?.onSubmitFilterState?.({})}>
        Terapkan Filter
      </button>
    </div>
  ),
}));

describe("CuratorDashboardPage", () => {
  beforeEach(() => {
    mockReplace.mockReset();
    mockPush.mockReset();
    mockUseAuth.mockReset();
    mockUsePathname.mockReturnValue("/curator-dashboard");
    mockUseDashboardData.mockClear();
    mockInformationSection.mockClear();
    window.localStorage.clear();
  });

  it("renders dashboard content for curator role", async () => {
    mockUseAuth.mockReturnValue({
      user: { id: 2, email: "curator@mail.com", name: "Curator", role: "CURATOR" },
      logout: jest.fn(),
    });

    render(<CuratorDashboardPage />);

    const filterHeadings = await screen.findAllByText(/Filter Informasi Penyakit Menular/i);
    expect(filterHeadings.length).toBeGreaterThan(0);
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it("renders dashboard for EXP_USER role", async () => {
    mockUseAuth.mockReturnValue({
      user: { id: 3, email: "exp@mail.com", name: "Explorer", role: "EXP_USER" },
      logout: jest.fn(),
    });

    render(<CuratorDashboardPage />);

    const filterHeadings = await screen.findAllByText(/Filter Informasi Penyakit Menular/i);
    expect(filterHeadings.length).toBeGreaterThan(0);
    expect(await screen.findByText("Visualisasi Excel")).toBeInTheDocument();
    expect(screen.queryByText("Akses Ditolak")).not.toBeInTheDocument();
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it("redirects to login when no user is available", async () => {
    mockUseAuth.mockReturnValue({
      user: null,
      logout: jest.fn(),
    });

    render(<CuratorDashboardPage />);

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith("/login?next=%2Fcurator-dashboard");
    });

    expect(screen.getByText(/Memeriksa akses/i)).toBeInTheDocument();
  });
});

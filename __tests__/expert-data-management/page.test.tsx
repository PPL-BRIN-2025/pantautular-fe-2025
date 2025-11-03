import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

const mockPush = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
}));

jest.mock("../../app/components/Navbar", () => () => (
  <div data-testid="mock-navbar">Navbar</div>
));
jest.mock("../../app/components/Footer", () => () => (
  <div data-testid="mock-footer">Footer</div>
));

import ExpertDataManagementPage from "../../app/expert-data-management/page";

describe("ExpertDataManagementPage", () => {
  beforeEach(() => {
    mockPush.mockClear();
  });

  test("renders layout chrome and table headers", async () => {
    render(<ExpertDataManagementPage />);

    expect(screen.getByTestId("mock-navbar")).toBeInTheDocument();
    expect(screen.getByTestId("mock-footer")).toBeInTheDocument();
    expect(screen.getByText(/Expert \/ Dataset/i)).toBeInTheDocument();

    for (const h of ["Data ID", "File Name", "Last Edited", "Submitted by", "Action"]) {
      expect(screen.getByText(h)).toBeInTheDocument();
    }
  });

  test("renders 9 distinct dummy rows", async () => {
    render(<ExpertDataManagementPage />);

    expect(await screen.findByText("ID1")).toBeInTheDocument();
    expect(screen.getByText("Report_Jakarta.xlsx")).toBeInTheDocument();
    expect(screen.getByText("Survey_Bandung.csv")).toBeInTheDocument();
    expect(screen.getByText("Public_Health_Analysis.xlsx")).toBeInTheDocument();

    const viewButtons = screen.getAllByRole("button", { name: /view/i });
    expect(viewButtons).toHaveLength(9);

    expect(screen.getByText("2025-09-01 09:23:45")).toBeInTheDocument();
    expect(screen.getByText("2025-09-27 15:33:37")).toBeInTheDocument();
  });

  test("clicking VIEW navigates to expert-view with the row id", async () => {
    const user = userEvent.setup();
    render(<ExpertDataManagementPage />);

    const firstView = await screen.findAllByRole("button", { name: /view/i });
    await user.click(firstView[0]);

    expect(mockPush).toHaveBeenCalledWith("/expert-view?id=ID1");
  });

  test("renders fallback 'No data.' when rows are empty (via prop injection)", async () => {
    render(<ExpertDataManagementPage initialRows={[]} />);

    expect(screen.getByText(/No data\./i)).toBeInTheDocument();
  });

  test("renders error message when error state is set (via prop injection)", async () => {
    render(<ExpertDataManagementPage initialError={"Failed to load data."} />);

    expect(screen.getByText("Failed to load data.")).toBeInTheDocument();
  });

  test("covers catch branch: when loading throws, shows fallback error message", async () => {
    render(<ExpertDataManagementPage simulateLoadError={true} />);

    expect(screen.getByText("Failed to load data.")).toBeInTheDocument();
  });
});

// import React from "react";
// import { screen, fireEvent } from "@testing-library/react";

const mockBack = jest.fn();
const mockGet = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    back: mockBack,
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
  useSearchParams: () => ({
    get: mockGet,
  }),
}));

// Mock layout components with stable testids
jest.mock("../../../app/components/Navbar", () => () => <div data-testid="navbar">Navbar</div>);
jest.mock("../../../app/components/Footer", () => () => <div data-testid="footer">Footer</div>);

import ExpertViewPage from "../../app/expert-data-management/view/page";

// Cast the Next.js page component so tests can pass props without TS errors
type PageProps = { dataset?: any; fileName?: string };
const SUT = ExpertViewPage as unknown as React.FC<PageProps>;

describe("ExpertViewPage", () => {
  const mockData = [
    {
      id: "ID1",
      gender: "Laki-laki",
      age: 21,
      city: "Jakarta",
      status: "status a",
      disease_id: "ID X",
      location_id: "ID Y",
      severity: "severity a",
    },
    {
      id: "ID3",
      gender: "Perempuan",
      age: 35,
      city: "Bandung",
      status: "status b",
      disease_id: "ID A",
      location_id: "ID B",
      severity: "severity b",
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders dataset title, back button, and table headers", () => {
    mockGet.mockReturnValue("FILE_123");
    render(<SUT dataset={mockData} fileName="CSV_1.xlsx" />);

    expect(screen.getByText("< back")).toBeInTheDocument();
    expect(screen.getByText("CSV_1.xlsx")).toBeInTheDocument();

    const headers = [
      "ID Data",
      "Jenis Kelamin",
      "Usia",
      "Kota",
      "STATUS",
      "ID Penyakit",
      "ID Lokasi",
      "Tingkat Keparahan",
    ];
    headers.forEach((h) => expect(screen.getByText(h)).toBeInTheDocument());
  });

  test("renders correct number of dataset rows and info text", () => {
    mockGet.mockReturnValue("FILE_123");
    render(<SUT dataset={mockData} fileName="CSV_1.xlsx" />);
    expect(screen.getAllByRole("row")).toHaveLength(mockData.length + 1);
    expect(screen.getByText("2 rows • 8 columns")).toBeInTheDocument();
  });

  test("renders fallback dummy data when dataset prop is missing", () => {
    mockGet.mockReturnValue("FILE_123");
    render(<SUT />);
    expect(screen.getByText("ID1")).toBeInTheDocument();
    expect(screen.getByText("ID3")).toBeInTheDocument();
  });

  test("renders 'No data available' when dataset is empty", () => {
    mockGet.mockReturnValue("FILE_123");
    render(<SUT dataset={[]} fileName="Empty.xlsx" />);
    expect(screen.getByText("No data available")).toBeInTheDocument();
  });

  test("uses fileId from URL when fileName not provided (covers fileName fallback branch)", () => {
    mockGet.mockImplementation((k: string) => (k === "fileId" ? "FILE_123" : null));
    render(<SUT dataset={mockData} />);
    expect(screen.getByText("FILE_123")).toBeInTheDocument();
    expect(mockGet).toHaveBeenCalledWith("fileId");
  });

  test("still renders when neither fileName nor fileId exists (covers missing param branch)", () => {
    mockGet.mockReturnValue(null);
    render(<SUT dataset={mockData} />);
    expect(screen.getByText("ID Data")).toBeInTheDocument();
    expect(screen.getByText("2 rows • 8 columns")).toBeInTheDocument();
  });

  test("clicking '< back' triggers router.back()", () => {
    mockGet.mockReturnValue("FILE_123");
    render(<SUT dataset={mockData} fileName="CSV_1.xlsx" />);
    fireEvent.click(screen.getByText("< back"));
    expect(mockBack).toHaveBeenCalled();
  });

  test("renders mocked Navbar and Footer", () => {
    mockGet.mockReturnValue("FILE_123");
    render(<SUT dataset={mockData} fileName="CSV_1.xlsx" />);
    expect(screen.getByTestId("navbar")).toBeInTheDocument();
    expect(screen.getByTestId("footer")).toBeInTheDocument();
  });

  test("updates shown filename when prop changes (rerender path)", () => {
    mockGet.mockReturnValue("FILE_123");
    const { rerender } = render(<SUT dataset={mockData} fileName="Initial.xlsx" />);
    expect(screen.getByText("Initial.xlsx")).toBeInTheDocument();

    rerender(<SUT dataset={mockData} fileName="Dynamic.xlsx" />);
    expect(screen.getByText("Dynamic.xlsx")).toBeInTheDocument();
    expect(screen.getByText("ID1")).toBeInTheDocument();
  });
});

describe("RBAC – ExpertDataManagementPage", () => {
  const mockReplace = jest.fn();
  const mockUser = (role: string | null) =>
    jest.fn().mockReturnValue({ user: role ? { role } : null });

  beforeEach(() => {
    jest.resetModules();
  });

  test("redirects guest user to login", async () => {
    jest.doMock("../../app/auth/hooks/useAuth", () => ({
      useAuth: mockUser(null),
    }));
    jest.doMock("next/navigation", () => ({
      useRouter: () => ({ replace: mockReplace }),
    }));

    const Page = (await import("../../app/expert-data-management/page")).default;
    render(<Page />);
    // expectation: show "Memeriksa akses…" temporarily
    expect(screen.getByText(/Memeriksa akses/i)).toBeInTheDocument();
  });

  test("shows AccessDeniedNotice for non-EXP_USER", async () => {
    jest.doMock("../../app/auth/hooks/useAuth", () => ({
      useAuth: mockUser("CURATOR"),
    }));
    const Page = (await import("../../app/expert-data-management/page")).default;
    render(<Page />);
    expect(await screen.findByText(/akses/i)).toBeInTheDocument();
  });

  test("renders table for EXP_USER", async () => {
    jest.doMock("../../app/auth/hooks/useAuth", () => ({
      useAuth: mockUser("EXP_USER"),
    }));
    const Page = (await import("../../app/expert-data-management/page")).default;
    render(<Page />);
    expect(await screen.findByText(/Expert \/ Dataset/i)).toBeInTheDocument();
    expect(screen.getByText("Report_Jakarta.xlsx")).toBeInTheDocument();
  });
});

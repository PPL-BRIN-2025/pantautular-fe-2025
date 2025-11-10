import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockPrefetch = jest.fn();
const mockBack = jest.fn();
const mockGet = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
    prefetch: mockPrefetch,
    back: mockBack,
  }),
  useSearchParams: () => ({
    get: mockGet,
  }),
}));

jest.mock("../../app/components/Navbar", () => () => (
  <div data-testid="mock-navbar">Navbar</div>
));
jest.mock("../../app/components/Footer", () => () => (
  <div data-testid="mock-footer">Footer</div>
));

const mockUseAuth = jest.fn(() => ({ user: { role: "EXP_USER" } }));
jest.mock("../../app/auth/hooks/useAuth", () => ({
  useAuth: () => mockUseAuth(),
}));

const resetRouterMocks = () => {
  mockPush.mockClear();
  mockReplace.mockClear();
  mockPrefetch.mockClear();
  mockBack.mockClear();
};

const SAMPLE_ROWS = [
  { data_id: "ID1", file_name: "Report_Jakarta.xlsx", last_edited: "2025-09-01 09:23:45", submitted_by: "EXPERTA" },
  { data_id: "ID2", file_name: "Survey_Bandung.csv", last_edited: "2025-09-05 11:12:30", submitted_by: "EXPERTB" },
  { data_id: "ID3", file_name: "Dataset_Sulsel.xls", last_edited: "2025-09-07 14:45:21", submitted_by: "EXPERTC" },
  { data_id: "ID4", file_name: "Health_Data_Sumatera.xlsx", last_edited: "2025-09-10 16:02:10", submitted_by: "EXPERTD" },
  { data_id: "ID5", file_name: "Malaria_Study.csv", last_edited: "2025-09-14 08:30:42", submitted_by: "EXPERTE" },
  { data_id: "ID6", file_name: "Vaccine_Report.xls", last_edited: "2025-09-18 12:17:55", submitted_by: "EXPERTA" },
  { data_id: "ID7", file_name: "COVID_Tracking.xlsx", last_edited: "2025-09-20 09:40:12", submitted_by: "EXPERTB" },
  { data_id: "ID8", file_name: "Tuberculosis_Study.csv", last_edited: "2025-09-23 10:58:03", submitted_by: "EXPERTC" },
  { data_id: "ID9", file_name: "Public_Health_Analysis.xlsx", last_edited: "2025-09-27 15:33:37", submitted_by: "EXPERTD" },
];

const mockFetch = jest.fn();
const mockConfirm = jest.fn(() => true);
const mockAlert = jest.fn();

const makeListResponse = () => ({
  ok: true,
  status: 200,
  json: async () => ({ results: SAMPLE_ROWS }),
  text: async () => "",
});

const bindGlobals = () => {
  const g = globalThis as any;
  g.fetch = mockFetch;
  g.confirm = mockConfirm;
  g.alert = mockAlert;
  if (g.window) {
    g.window.fetch = mockFetch;
    g.window.confirm = mockConfirm;
    g.window.alert = mockAlert;
  }
};

bindGlobals();
beforeAll(bindGlobals);

beforeEach(() => {
  mockFetch.mockReset();
  mockFetch.mockImplementation(() => Promise.resolve(makeListResponse()));
  mockConfirm.mockClear();
  mockAlert.mockClear();
  if (typeof window !== "undefined") {
    window.localStorage?.clear?.();
  }
  if (typeof document !== "undefined") {
    document.cookie = "";
  }
});

import ExpertDataManagementPage, {
  __test_getToken as getTokenHelper,
  __test_getTokenForDelete as getTokenForDeleteHelper,
  __test_filterRows as filterRowsHelper,
} from "../../app/expert-data-management/page";

describe("ExpertDataManagementPage", () => {
  beforeEach(() => {
    mockPush.mockClear();
    mockUseAuth.mockImplementation(() => ({ user: { role: "EXP_USER" } }));
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

    expect(mockPush).toHaveBeenCalledTimes(1);
    const pushedUrl = mockPush.mock.calls[0][0];
    expect(pushedUrl).toContain("/expert-data-management/view");
    expect(pushedUrl).toContain("id=ID1");
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

  test("clicking DELETE removes the row from the table", async () => {
    const user = userEvent.setup();
    const sampleRows = [
      {
        data_id: "ID_DEL_1",
        file_name: "File1.xlsx",
        last_edited: "2025-01-01 00:00:00",
        submitted_by: "USERA",
      },
      {
        data_id: "ID_DEL_2",
        file_name: "File2.xlsx",
        last_edited: "2025-01-02 00:00:00",
        submitted_by: "USERB",
      },
    ];

    render(<ExpertDataManagementPage initialRows={sampleRows} />);

    expect(await screen.findByText("ID_DEL_1")).toBeInTheDocument();

    const deleteButtons = screen.getAllByRole("button", { name: /delete/i });
    expect(deleteButtons).toHaveLength(2);

    await user.click(deleteButtons[0]);

    expect(screen.queryByText("ID_DEL_1")).not.toBeInTheDocument();
    expect(screen.getByText("ID_DEL_2")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /delete/i }));

    expect(screen.queryByText("ID_DEL_2")).not.toBeInTheDocument();
    expect(screen.getByText(/No data\./i)).toBeInTheDocument();
  });

  test("filter input narrows rows, shows clear button, and handles no matches", async () => {
    const user = userEvent.setup();
    render(<ExpertDataManagementPage />);

    const filterInput = screen.getByRole("textbox", { name: /filter datasets/i });
    await screen.findByText("Report_Jakarta.xlsx");

    await user.type(filterInput, "id1");
    expect(await screen.findByText("ID1")).toBeInTheDocument();
    expect(screen.queryByText("ID2")).not.toBeInTheDocument();

    const clearButton = screen.getByRole("button", { name: /clear/i });
    expect(clearButton).toBeInTheDocument();
    await user.click(clearButton);
    expect(filterInput).toHaveValue("");
    expect(await screen.findByText("ID2")).toBeInTheDocument();

    await user.type(filterInput, "malaria");
    expect(await screen.findByText("Malaria_Study.csv")).toBeInTheDocument();
    await user.clear(filterInput);
    expect(await screen.findByText("Survey_Bandung.csv")).toBeInTheDocument();

    await user.type(filterInput, "2025-09-23");
    expect(await screen.findByText("2025-09-23 10:58:03")).toBeInTheDocument();
    await user.clear(filterInput);
    expect(await screen.findByText("2025-09-27 15:33:37")).toBeInTheDocument();

    await user.type(filterInput, "experta");
    const expertaCells = await screen.findAllByText("EXPERTA");
    expect(expertaCells.length).toBeGreaterThan(0);
    await user.clear(filterInput);
    const expertBCells = await screen.findAllByText("EXPERTB");
    expect(expertBCells.length).toBeGreaterThan(0);

    await user.type(filterInput, "nomatch");
    expect(await screen.findByText(/No matching data\./i)).toBeInTheDocument();
  });

  test("filter gracefully handles rows with nullish string fields", async () => {
    const user = userEvent.setup();
    const nullishRows = [
      {
        data_id: undefined,
        file_name: "HasFile.csv",
        last_edited: undefined,
        submitted_by: undefined,
      },
      {
        data_id: "ID_W_LE",
        file_name: undefined,
        last_edited: "2025-12-01 01:00:00",
        submitted_by: undefined,
      },
      {
        data_id: "ID_W_SUB",
        file_name: undefined,
        last_edited: undefined,
        submitted_by: "NULLSUB",
      },
    ] as any;

    render(<ExpertDataManagementPage initialRows={nullishRows} />);

    const filterInput = screen.getByRole("textbox", { name: /filter datasets/i });

    await user.type(filterInput, "hasfile");
    expect(await screen.findByText("HasFile.csv")).toBeInTheDocument();

    await user.clear(filterInput);
    await user.type(filterInput, "2025-12-01");
    expect(await screen.findByText("2025-12-01 01:00:00")).toBeInTheDocument();

    await user.clear(filterInput);
    await user.type(filterInput, "nullsub");
    expect(await screen.findByText("NULLSUB")).toBeInTheDocument();
  });

  test("uses stored access token from user blob when fetching datasets", async () => {
    window.localStorage.setItem("user", JSON.stringify({ access_token: "JSON_TOKEN" }));

    render(<ExpertDataManagementPage />);

    expect(await screen.findByText("ID1")).toBeInTheDocument();
    const [, options] = mockFetch.mock.calls[0];
    expect(options?.headers?.Authorization).toBe("Bearer JSON_TOKEN");
  });

  test("falls back to simple token keys when user blob is invalid JSON", async () => {
    window.localStorage.setItem("user", "not-json");
    window.localStorage.setItem("token", "FALLBACK_TOKEN");

    render(<ExpertDataManagementPage />);

    expect(await screen.findByText("ID1")).toBeInTheDocument();
    const [, options] = mockFetch.mock.calls[0];
    expect(options?.headers?.Authorization).toBe("Bearer FALLBACK_TOKEN");
  });

  test("falls back to cookie token when no storage entries exist", async () => {
    document.cookie = "access_token=Cookie%20Token";

    render(<ExpertDataManagementPage />);

    expect(await screen.findByText("ID1")).toBeInTheDocument();
    const [, options] = mockFetch.mock.calls[0];
    expect(options?.headers?.Authorization).toBe("Bearer Cookie Token");
  });

  test("hydrates user from stored blob when auth hook returns null", async () => {
    window.localStorage.setItem("user", JSON.stringify({ role: "EXP_USER" }));
    mockUseAuth.mockImplementation(() => ({ user: null }));

    render(<ExpertDataManagementPage />);

    expect(await screen.findByText(/Expert \/ Dataset/i)).toBeInTheDocument();
  });

  test("handleDelete ignores rows without batch id", async () => {
    const user = userEvent.setup();
    const rows = [
      { data_id: "", file_name: "NoId.csv", last_edited: "2025-01-01", submitted_by: "USER" } as any,
    ];

    render(<ExpertDataManagementPage initialRows={rows} />);

    await user.click(screen.getByRole("button", { name: /delete/i }));
    expect(mockConfirm).not.toHaveBeenCalled();
    expect(mockFetch).not.toHaveBeenCalled();
    expect(screen.getByText("NoId.csv")).toBeInTheDocument();
  });

  test("handleDelete aborts when confirmation is rejected", async () => {
    const user = userEvent.setup();
    const rows = [
      { data_id: "BATCH-1", file_name: "Batch1.csv", last_edited: "2025-01-01", submitted_by: "USER" } as any,
    ];
    mockConfirm.mockReturnValueOnce(false);

    render(<ExpertDataManagementPage initialRows={rows} />);

    await user.click(screen.getByRole("button", { name: /delete/i }));
    expect(mockFetch).not.toHaveBeenCalled();
    expect(screen.getByText("BATCH-1")).toBeInTheDocument();
  });

  test("handleDelete removes row and sends Authorization header on success", async () => {
    const user = userEvent.setup();
    const sampleRows = [
      { data_id: "ID_DEL_1", file_name: "File1.csv", last_edited: "2025-01-01", submitted_by: "USER" },
      { data_id: "ID_DEL_2", file_name: "File2.csv", last_edited: "2025-01-02", submitted_by: "USER" },
    ];
    window.localStorage.setItem("user", JSON.stringify({ access_token: "DELETE_TOKEN" }));

    render(<ExpertDataManagementPage initialRows={sampleRows} />);

    const deleteButton = screen.getAllByRole("button", { name: /delete/i })[0];
    await user.click(deleteButton);

    await waitFor(() => expect(screen.queryByText("ID_DEL_1")).not.toBeInTheDocument());
    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [, options] = mockFetch.mock.calls[0];
    expect(options?.headers?.Authorization).toBe("Bearer DELETE_TOKEN");
  });

  test("handleDelete surfaces server errors via alert", async () => {
    const user = userEvent.setup();
    const rows = [
      { data_id: "ID_DEL_1", file_name: "File1.csv", last_edited: "2025-01-01", submitted_by: "USER" },
    ];
    mockFetch.mockImplementationOnce(() =>
      Promise.resolve({
        status: 500,
        text: async () => "boom",
      })
    );

    render(<ExpertDataManagementPage initialRows={rows} />);

    await user.click(screen.getByRole("button", { name: /delete/i }));
    await waitFor(() => expect(mockAlert).toHaveBeenCalledWith("Failed to delete batch (status 500)."));
    expect(screen.getByText("ID_DEL_1")).toBeInTheDocument();
  });

  test("handleDelete reports network failures", async () => {
    const user = userEvent.setup();
    const rows = [
      { data_id: "ID_DEL_1", file_name: "File1.csv", last_edited: "2025-01-01", submitted_by: "USER" },
    ];
    mockFetch.mockImplementationOnce(() => Promise.reject(new Error("network down")));

    render(<ExpertDataManagementPage initialRows={rows} />);

    await user.click(screen.getByRole("button", { name: /delete/i }));
    await waitFor(() => expect(mockAlert).toHaveBeenCalledWith("Delete failed (network)."));
    expect(screen.getByText("ID_DEL_1")).toBeInTheDocument();
  });
});

// import React from "react";
// import { screen, fireEvent } from "@testing-library/react";

// Mock layout components with stable testids
jest.mock("../../app/components/Navbar", () => () => <div data-testid="navbar">Navbar</div>);
jest.mock("../../app/components/Footer", () => () => <div data-testid="footer">Footer</div>);

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


describe("RBAC - ExpertDataManagementPage", () => {
  beforeEach(() => {
    resetRouterMocks();
    mockUseAuth.mockReset();
  });

  test("redirects guest user to login", async () => {
    mockUseAuth.mockImplementation(() => ({ user: null }));
    render(<ExpertDataManagementPage />);

    expect(screen.getByText(/Memeriksa akses/i)).toBeInTheDocument();
    await waitFor(() =>
      expect(mockReplace).toHaveBeenCalledWith("/login?next=%2Fexpert-data-management")
    );
  });

  test("shows AccessDeniedNotice for non-EXP_USER", async () => {
    mockUseAuth.mockImplementation(() => ({ user: { role: "CURATOR" } }));
    render(<ExpertDataManagementPage />);
    expect(await screen.findByText(/Akses Expert Ditolak/i)).toBeInTheDocument();
  });

  test("renders table for EXP_USER", async () => {
    mockUseAuth.mockImplementation(() => ({ user: { role: "EXP_USER" } }));
    render(<ExpertDataManagementPage />);
    expect(await screen.findByText(/Expert \/ Dataset/i)).toBeInTheDocument();
    expect(screen.getByText("Report_Jakarta.xlsx")).toBeInTheDocument();
  });
});

describe("token helper functions", () => {
  beforeEach(() => {
    window.localStorage?.clear?.();
    document.cookie = "";
  });

  test("getToken returns null when no storage exists", () => {
    expect(getTokenHelper()).toBeNull();
  });

  test("getToken reads access_token from stored user", () => {
    window.localStorage.setItem("user", JSON.stringify({ access_token: "STORED" }));
    expect(getTokenHelper()).toBe("STORED");
  });

  test("getToken reads token field when access_token missing", () => {
    window.localStorage.setItem("user", JSON.stringify({ token: "SECONDARY" }));
    expect(getTokenHelper()).toBe("SECONDARY");
  });

  test("getToken falls back to jwt key", () => {
    window.localStorage.setItem("jwt", "JWT_TOKEN");
    expect(getTokenHelper()).toBe("JWT_TOKEN");
  });

  test("getToken falls back to cookie value", () => {
    document.cookie = "access_token=Cookie%20Token";
    expect(getTokenHelper()).toBe("Cookie Token");
  });

  test("getTokenForDelete returns null when window is undefined", () => {
    const originalWindow = (globalThis as any).window;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (globalThis as any).window;
    expect(getTokenForDeleteHelper()).toBeNull();
    (globalThis as any).window = originalWindow;
  });

  test("getTokenForDelete checks token key order", () => {
    window.localStorage.setItem("token", "TOKEN_KEY");
    expect(getTokenForDeleteHelper()).toBe("TOKEN_KEY");
  });

  test("getTokenForDelete reads token field from stored user blob", () => {
    window.localStorage.setItem("user", JSON.stringify({ token: "DEL_TOKEN" }));
    expect(getTokenForDeleteHelper()).toBe("DEL_TOKEN");
  });

  test("getTokenForDelete uses cookie fallback", () => {
    document.cookie = "access_token=CookieDelete";
    expect(getTokenForDeleteHelper()).toBe("CookieDelete");
  });

  test("filterRows returns original rows when query blank", () => {
    const rows = [
      { data_id: "A", file_name: "alpha", last_edited: "2024", submitted_by: "USER" },
      { data_id: "B", file_name: "beta", last_edited: "2024", submitted_by: "USER" },
    ] as any;
    expect(filterRowsHelper(rows, "   ")).toEqual(rows);
  });

  test("filterRows matches case-insensitive text across fields", () => {
    const rows = [
      { data_id: "ROW_1", file_name: "Alpha.csv", last_edited: "2024", submitted_by: "USERA" },
      { data_id: "ROW_2", file_name: "Beta.csv", last_edited: "2025", submitted_by: "USERB" },
    ] as any;
    const result = filterRowsHelper(rows, "beta");
    expect(result).toHaveLength(1);
    expect(result[0].data_id).toBe("ROW_2");
  });
});

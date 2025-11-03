import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";

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

import ExpertViewPage from "../../../app/expert-data-management/view/page";

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


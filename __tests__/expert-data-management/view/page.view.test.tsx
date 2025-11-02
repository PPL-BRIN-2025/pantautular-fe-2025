import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import ExpertViewPage from "../../../app/expert-data-management/view/page";
import { useRouter, useSearchParams } from "next/navigation";

// Mock Next.js hooks
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
}));

// Mock child components to isolate logic
jest.mock("../../../app/components/Navbar", () => () => <div data-testid="navbar">Navbar</div>);
jest.mock("../../../app/components/Footer", () => () => <div data-testid="footer">Footer</div>);

describe("Expert Dataset View Page", () => {
  const mockPush = jest.fn();
  const mockBack = jest.fn();
  const mockSearchParams = new URLSearchParams("?id=TestFile.xlsx");

  beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue({ back: mockBack, push: mockPush });
    (useSearchParams as jest.Mock).mockReturnValue(mockSearchParams);
    jest.clearAllMocks();
  });

  const mockData = [
    {
      data_id: "ID1",
      gender: "Perempuan",
      age: 14,
      city: "jakarta",
      status: "status a",
      disease_id: "ID A",
      location_id: "ID B",
      severity: "severity a",
    },
    {
      data_id: "ID2",
      gender: "Laki-laki",
      age: 14,
      city: "jakarta",
      status: "status b",
      disease_id: "ID A",
      location_id: "ID B",
      severity: "severity b",
    },
  ];

  test("renders dataset title, back button, and table headers", () => {
    render(<ExpertViewPage dataset={mockData} fileName="CSV_1.xlsx" />);

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
    headers.forEach((header) => {
      expect(screen.getByText(header)).toBeInTheDocument();
    });
  });

  test("renders correct number of dataset rows and info text", () => {
    render(<ExpertViewPage dataset={mockData} fileName="CSV_1.xlsx" />);
    expect(screen.getAllByRole("row")).toHaveLength(mockData.length + 1);
    expect(screen.getByText("2 rows • 8 columns")).toBeInTheDocument();
  });

  test("renders fallback dummy data when dataset prop is missing", () => {
    render(<ExpertViewPage />);
    expect(screen.getByText("ID1")).toBeInTheDocument();
    expect(screen.getByText("ID3")).toBeInTheDocument();
  });

  test("renders 'No data available' when dataset is empty", () => {
    render(<ExpertViewPage dataset={[]} fileName="Empty.xlsx" />);
    expect(screen.getByText("No data available")).toBeInTheDocument();
  });

  test("renders fallback fileId from URL when fileName not provided", () => {
    render(<ExpertViewPage dataset={mockData} />);
    expect(screen.getByText("TestFile.xlsx")).toBeInTheDocument();
  });

  test("calls router.back() when back button is clicked", () => {
    render(<ExpertViewPage dataset={mockData} fileName="CSV_1.xlsx" />);
    fireEvent.click(screen.getByText("< back"));
    expect(mockBack).toHaveBeenCalledTimes(1);
  });

  test("renders Navbar and Footer components", () => {
    render(<ExpertViewPage dataset={mockData} fileName="CSV_1.xlsx" />);
    expect(screen.getByTestId("navbar")).toBeInTheDocument();
    expect(screen.getByTestId("footer")).toBeInTheDocument();
  });

  test("renders error message when useEffect throws an error", async () => {
    jest.spyOn(console, "error").mockImplementation(() => {}); // silence React error
  
    // Mock useState so that it throws inside useEffect to trigger the catch block
    const originalUseState = jest.requireActual("react").useState;
    jest.spyOn(require("react"), "useState").mockImplementationOnce(() => {
      throw new Error("Simulated crash in useEffect");
    });
  
    render(<ExpertViewPage dataset={undefined as any} />);
  
    // The error boundary in component should catch and render this message
    expect(await screen.findByText("Failed to load data")).toBeInTheDocument();
  
    // Restore mocks
    jest.restoreAllMocks();
    jest.spyOn(require("react"), "useState").mockImplementation(originalUseState);
  });
  
  

  test("updates when dataset changes dynamically", () => {
    const { rerender } = render(<ExpertViewPage dataset={[]} fileName="Dynamic.xlsx" />);
    expect(screen.getByText("No data available")).toBeInTheDocument();

    rerender(<ExpertViewPage dataset={mockData} fileName="Dynamic.xlsx" />);
    expect(screen.getByText("ID1")).toBeInTheDocument();
  });
  

  
});

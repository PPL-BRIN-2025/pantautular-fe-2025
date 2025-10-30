import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import ExpertViewPage from "./page"; 

// Dummy dataset rows
const mockData = [
  { data_id: "ID1", gender: "Perempuan", age: 14, city: "jakarta", status: "status a", disease_id: "ID A", location_id: "ID B", severity: "severity a" },
  { data_id: "ID2", gender: "Laki-laki", age: 14, city: "jakarta", status: "status b", disease_id: "ID A", location_id: "ID B", severity: "severity b" },
  { data_id: "ID3", gender: "Lainnya", age: 14, city: "jakarta", status: "status c", disease_id: "ID A", location_id: "ID B", severity: "severity c" },
];

describe("Expert Dataset View Page", () => {
  test("renders dataset title, back button, and table headers", () => {
    render(<ExpertViewPage dataset={mockData} fileName="CSV_1.xlsx" />);

    // Header elements
    expect(screen.getByText("< back")).toBeInTheDocument();
    expect(screen.getByText("CSV_1.xlsx")).toBeInTheDocument();

    // Table headers
    const headers = ["DATA ID", "GENDER", "AGE", "CITY", "STATUS", "DISEASE ID", "LOCATION ID", "SEVERITY"];
    headers.forEach((header) => {
      expect(screen.getByText(header)).toBeInTheDocument();
    });
  });

  test("renders all dataset rows", () => {
    render(<ExpertViewPage dataset={mockData} fileName="CSV_1.xlsx" />);

    // show 3 data rows
    expect(screen.getAllByRole("row")).toHaveLength(mockData.length + 1); // header + rows
  });

  test("handles empty or missing data gracefully", () => {
    render(<ExpertViewPage dataset={[]} fileName="EmptyFile.xlsx" />);
    expect(screen.getByText("No data available")).toBeInTheDocument();
  });
});

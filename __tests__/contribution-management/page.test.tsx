import "@testing-library/jest-dom";
import { render, screen, fireEvent } from "@testing-library/react";
import ContributionManagementPage from "../../app/contribution-management/page";

// Mock layout components 
jest.mock("../../app/components/Navbar", () => () => <div data-testid="navbar" />);
jest.mock("../../app/components/Footer", () => () => <div data-testid="footer" />);

describe("ContributionManagementPage", () => {
  test("renders all dummy contributions by default", () => {
    render(<ContributionManagementPage />);

    // All rows should be shown initially (9 dummy items)
    const rows = screen.getAllByRole("listitem");
    expect(rows).toHaveLength(9);

    // Spot-check a couple of IDs / titles
    expect(screen.getByText("ID1")).toBeInTheDocument();
    expect(screen.getByText("ID9")).toBeInTheDocument();
    expect(screen.getByText("Bla Bla Bla")).toBeInTheDocument();
    expect(screen.getByText("Penyakit Menular")).toBeInTheDocument();
  });

  test("has search input with correct placeholder", () => {
    render(<ContributionManagementPage />);

    const input = screen.getByPlaceholderText("Cari Judul / Nama Kontributor");
    expect(input).toBeInTheDocument();
  });

  test("filters by title when searching", () => {
    render(<ContributionManagementPage />);

    const input = screen.getByPlaceholderText("Cari Judul / Nama Kontributor");

    // Type part of a title that should uniquely match ID9
    fireEvent.change(input, { target: { value: "penyakit" } });

    const rows = screen.getAllByRole("listitem");
    expect(rows).toHaveLength(1);

    expect(screen.getByText("ID9")).toBeInTheDocument();
    expect(screen.getByText("Penyakit Menular")).toBeInTheDocument();
  });

  test("filters by contributor username when searching", () => {
    render(<ContributionManagementPage />);

    const input = screen.getByPlaceholderText("Cari Judul / Nama Kontributor");

    // Search by username; should match only KontributorB (ID2)
    fireEvent.change(input, { target: { value: "kontributorb" } });

    const rows = screen.getAllByRole("listitem");
    expect(rows).toHaveLength(1);

    expect(screen.getByText("ID2")).toBeInTheDocument();
    expect(screen.getByText("Lorem Ipsum")).toBeInTheDocument();
    expect(screen.getByText("KontributorB")).toBeInTheDocument();
  });

  test("shows empty state message when no contributions match", () => {
    render(<ContributionManagementPage />);

    const input = screen.getByPlaceholderText("Cari Judul / Nama Kontributor");

    fireEvent.change(input, { target: { value: "zzzz-not-found" } });

    expect(
      screen.getByText("Tidak ada data yang cocok.")
    ).toBeInTheDocument();
  });
});

import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";

// Mock Navbar & Footer to isolate the page component
jest.mock("../../app/components/Navbar", () => () => (
  <div data-testid="mock-navbar">Navbar</div>
));
jest.mock("../../app/components/Footer", () => () => (
  <div data-testid="mock-footer">Footer</div>
));

import CuratorDataManagementPage from "../../app/curator-data-management/page";

describe("CuratorDataManagementPage", () => {
  test("renders table header and first data row", () => {
    render(<CuratorDataManagementPage />);

    // check for label
    expect(screen.getByText(/List Data/i)).toBeInTheDocument();

    // check for table headers
    expect(screen.getByText(/Data ID/i)).toBeInTheDocument();
    expect(screen.getByText(/Title/i)).toBeInTheDocument();
    expect(screen.getByText(/Last Edited/i)).toBeInTheDocument();
    expect(screen.getByText(/Submitted by/i)).toBeInTheDocument();
    expect(screen.getByText(/Action/i)).toBeInTheDocument();

    // check for at least one dummy data row
    expect(screen.getByText(/ID1/i)).toBeInTheDocument();
    expect(screen.getByText(/Penyakit/i)).toBeInTheDocument();

    // check for action button
    expect(screen.getByText(/Ubah/i)).toBeInTheDocument();
  });

  test("handles pagination Next and Prev correctly", () => {
    render(<CuratorDataManagementPage />);

    // starts at page 1
    expect(screen.getByText("1 / 2")).toBeInTheDocument();

    // click Next -> should go to page 2
    const nextBtn = screen.getByText(/Next/i);
    fireEvent.click(nextBtn);
    expect(screen.getByText("2 / 2")).toBeInTheDocument();

    // click Prev -> should go back to page 1
    const prevBtn = screen.getByText(/Prev/i);
    fireEvent.click(prevBtn);
    expect(screen.getByText("1 / 2")).toBeInTheDocument();
  });

  test("disables Prev button on first page and Next button on last page", () => {
    render(<CuratorDataManagementPage />);

    const prevBtn = screen.getByText(/Prev/i);
    const nextBtn = screen.getByText(/Next/i);

    // On page 1, Prev should be disabled
    expect(prevBtn).toBeDisabled();

    // Go to last page
    fireEvent.click(nextBtn);
    expect(nextBtn).toBeDisabled();
  });
});

import React from "react";
import { render, screen } from "@testing-library/react";

beforeAll(() => {
    window.alert = jest.fn();
  });
  

// Mock Navbar & Footer to isolate component
jest.mock("../../app/components/Navbar", () => () => <div data-testid="mock-navbar">Navbar</div>);
jest.mock("../../app/components/Footer", () => () => <div data-testid="mock-footer">Footer</div>);

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
});

import React from "react";
import { render, screen } from "@testing-library/react";
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

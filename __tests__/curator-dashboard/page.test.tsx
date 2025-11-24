import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import CuratorDashboardPage from "../../app/curator-dashboard/page";

const mockReplace = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mockReplace, push: jest.fn(), prefetch: jest.fn() }),
}));

jest.mock("../../app/components/Navbar", () => () => <div data-testid="navbar" />);
jest.mock("../../app/components/dashboard/FilterSection", () => (props: any) => (
  <div data-testid="filter-section" onClick={() => props.onSubmitFilterState?.({ locations: { provinces: [], cities: [] } })} />
));
jest.mock("../../app/components/dashboard/InformationSection", () => (props: any) => (
  <div data-testid="information-section" data-filter={JSON.stringify(props.filterState)} />
));
jest.mock("../../app/curator-dashboard/_components/AccessDenied", () => () => <div data-testid="access-denied" />);

jest.mock("../../app/auth/hooks/useAuth", () => ({
  useAuth: jest.fn(),
}));

const mockUseAuth = require("../../app/auth/hooks/useAuth").useAuth as jest.Mock;

describe("CuratorDashboardPage access handling", () => {
  beforeEach(() => {
    mockReplace.mockReset();
  });

  it("redirects unauthenticated users and shows loading state", async () => {
    mockUseAuth.mockReturnValue({ user: null });
    render(<CuratorDashboardPage />);

    expect(screen.getByText(/Memeriksa akses/)).toBeInTheDocument();
    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith("/login?next=%2Fcurator-dashboard"));
  });

  it("blocks users with forbidden roles", async () => {
    mockUseAuth.mockReturnValue({ user: { role: "CONTRIBUTOR" } });
    render(<CuratorDashboardPage />);

    await waitFor(() => expect(screen.getByTestId("access-denied")).toBeInTheDocument());
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it("renders dashboard content for allowed roles", async () => {
    mockUseAuth.mockReturnValue({ user: { role: "ADMIN", name: "Admin" } });
    render(<CuratorDashboardPage />);

    await waitFor(() => expect(screen.getByTestId("filter-section")).toBeInTheDocument());
    expect(screen.getByTestId("information-section")).toBeInTheDocument();
  });
});

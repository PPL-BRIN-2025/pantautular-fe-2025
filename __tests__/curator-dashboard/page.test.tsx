import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import CuratorDashboardPage from "../../app/curator-dashboard/page";

const mockReplace = jest.fn();
const mockPush = jest.fn();
const mockUsePathname = jest.fn(() => "/curator-dashboard");

jest.mock("next/image", () => ({
  __esModule: true,
  default: (props: any) => {
    const { src, alt, ...rest } = props;
    return <img src={src} alt={alt} {...rest} />;
  },
}));

jest.mock("next/navigation", () => ({
  __esModule: true,
  useRouter: () => ({ replace: mockReplace, push: mockPush }),
  usePathname: () => mockUsePathname(),
}));

const mockUseAuth = jest.fn();

jest.mock("../../app/auth/hooks/useAuth", () => ({
  useAuth: () => mockUseAuth(),
}));

describe("CuratorDashboardPage", () => {
  beforeEach(() => {
    mockReplace.mockReset();
    mockPush.mockReset();
    mockUseAuth.mockReset();
    mockUsePathname.mockReturnValue("/curator-dashboard");
    window.localStorage.clear();
  });

  it("renders dashboard content for curator role", async () => {
    mockUseAuth.mockReturnValue({
      user: { id: 2, email: "curator@mail.com", name: "Curator", role: "CURATOR" },
      logout: jest.fn(),
    });

    render(<CuratorDashboardPage />);

    expect(await screen.findByText(/Filter Informasi Penyakit Menular/i)).toBeInTheDocument();
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it("shows access denied for non curator or admin roles", async () => {
    mockUseAuth.mockReturnValue({
      user: { id: 3, email: "exp@mail.com", name: "Explorer", role: "EXP_USER" },
      logout: jest.fn(),
    });

    render(<CuratorDashboardPage />);

    expect(await screen.findByText(/Akses Kurator Ditolak/i)).toBeInTheDocument();
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it("redirects to login when no user is available", async () => {
    mockUseAuth.mockReturnValue({
      user: null,
      logout: jest.fn(),
    });

    render(<CuratorDashboardPage />);

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith("/login?next=%2Fcurator-dashboard");
    });

    expect(screen.getByText(/Memeriksa akses/i)).toBeInTheDocument();
  });
});

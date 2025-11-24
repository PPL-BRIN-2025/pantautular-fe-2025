import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import Navbar, { ProfileIcon, RoleAccessMenu } from "../../app/components/Navbar";

const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockPathname = jest.fn();
const mockUseAuth = jest.fn();

jest.mock("next/navigation", () => ({
  usePathname: () => mockPathname(),
  useRouter: () => ({ push: mockPush, replace: mockReplace }),
}));

jest.mock("next/image", () => (props: any) => <img alt={props.alt} data-testid="nav-image" />);

jest.mock("../../app/components/ui-profile/dropdown-menu", () => ({
  DropdownMenu: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuTrigger: ({ children, ...rest }: any) => (
    <button type="button" {...rest}>
      {children}
    </button>
  ),
  DropdownMenuContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuItem: ({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) => (
    <button type="button" onClick={onClick}>
      {children}
    </button>
  ),
}));

jest.mock("../../app/components/password-settings", () => ({ onClose }: { onClose: () => void }) => (
  <div data-testid="password-settings">
    Password Settings
    <button type="button" onClick={onClose}>
      Close
    </button>
  </div>
));

jest.mock("../../app/auth/hooks/useAuth", () => ({
  useAuth: () => mockUseAuth(),
}));

describe("Navbar", () => {
  beforeEach(() => {
    mockPush.mockReset();
    mockReplace.mockReset();
    mockUseAuth.mockReset();
    mockPathname.mockReset();
    mockPathname.mockReturnValue("/");
  });

  test("renders login/register buttons for anonymous users", () => {
    mockUseAuth.mockReturnValue({ user: null, logout: jest.fn() });
    render(<Navbar />);

    fireEvent.click(screen.getByText("Masuk"));
    expect(mockPush).toHaveBeenCalledWith("/login");

    fireEvent.click(screen.getByText("Register"));
    expect(mockPush).toHaveBeenCalledWith("/register");
  });

  test("shows curator dropdown and profile actions for authenticated roles", () => {
    const logout = jest.fn();
    mockPathname.mockReturnValue("/dashboard");
    mockUseAuth.mockReturnValue({ user: { name: "Ina", role: "EXP_USER" }, logout });

    render(<Navbar />);

    expect(screen.getByText("Ina")).toBeInTheDocument();
    expect(screen.getByText("| Ahli")).toBeInTheDocument();
    expect(screen.getByText("Dashboard Ahli")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Pengaturan"));
    expect(screen.getByTestId("password-settings")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Close"));
    expect(screen.queryByTestId("password-settings")).not.toBeInTheDocument();

    fireEvent.click(screen.getByText("Keluar"));
    expect(logout).toHaveBeenCalled();

    const dashboardLink = screen.getByText("Dashboard");
    expect(dashboardLink.className).toContain("font-bold");
  });

  test("ProfileIcon toggles password modal independently", () => {
    render(<ProfileIcon logoutAction={jest.fn()} />);
    fireEvent.click(screen.getByText("Pengaturan"));
    expect(screen.getByTestId("password-settings")).toBeInTheDocument();
  });

  test("renders role access menu with nested children for ADMIN role", () => {
    render(<RoleAccessMenu role="ADMIN" />);

    expect(screen.getByLabelText("Akses Page")).toBeInTheDocument();
    expect(screen.getByText("Manajemen Data Ahli")).toBeInTheDocument();
    // child link label should render
    expect(screen.getByText("Lihat List Data (CSV)")).toBeInTheDocument();
  });
});

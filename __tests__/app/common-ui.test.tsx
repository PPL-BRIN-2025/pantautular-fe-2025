import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";

jest.mock("next/link", () => {
  const Link = ({ href, children, ...rest }: any) => (
    <a href={href} {...rest}>
      {children}
    </a>
  );
  Link.displayName = "NextLinkMock";
  return Link;
});

jest.mock("next/image", () => (props: any) => <img alt={props.alt} {...props} />);

let mockPathname = "/";
const mockRouterPush = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockRouterPush, replace: jest.fn() }),
  usePathname: () => mockPathname,
}));

jest.mock("../../app/components/ui-profile/dropdown-menu", () => {
  const React = require("react");
  return {
    DropdownMenu: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    DropdownMenuTrigger: ({ children, ...rest }: any) => (
      <button {...rest}>{children}</button>
    ),
    DropdownMenuContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    DropdownMenuItem: ({ children, ...rest }: any) => (
      <button {...rest}>{children}</button>
    ),
  };
});

jest.mock("../../app/components/password-settings", () => ({ onClose }: { onClose: () => void }) => (
  <div data-testid="password-settings">
    settings
    <button onClick={onClose}>close-settings</button>
  </div>
));

jest.mock("next/script", () => ({ children, ...rest }: any) => <script {...rest}>{children}</script>);

const mockUseAuth = jest.fn(() => ({ user: null, logout: jest.fn() }));
jest.mock("../../app/auth/hooks/useAuth", () => ({ useAuth: () => mockUseAuth() }));

describe("Common UI primitives", () => {
  beforeEach(() => {
    mockRouterPush.mockReset();
    mockUseAuth.mockReturnValue({ user: null, logout: jest.fn() });
    mockPathname = "/";
  });

  test("AccessDenied2 renders links", () => {
    const Component = require("../../app/components/AccessDenied2").default;
    render(<Component />);
    const links = screen.getAllByRole("link");
    expect(links[0]).toHaveAttribute("href", "/");
    expect(links[1]).toHaveAttribute("href", "/login?next=/expert-dashboard");
  });

  test("ButtonBase invokes custom onClick", () => {
    const ButtonBase = require("../../app/components/ButtonBase").default;
    const handler = jest.fn();
    render(
      <ButtonBase href="/next" onClick={handler}>
        Hit Me
      </ButtonBase>
    );
    fireEvent.click(screen.getByRole("button", { name: /hit me/i }));
    expect(handler).toHaveBeenCalled();
    expect(mockRouterPush).not.toHaveBeenCalled();
  });

  test("ButtonBase falls back to router push", () => {
    const ButtonBase = require("../../app/components/ButtonBase").default;
    render(<ButtonBase href="/next">Go</ButtonBase>);
    fireEvent.click(screen.getByRole("button", { name: "Go" }));
    expect(mockRouterPush).toHaveBeenCalledWith("/next");
  });

  test("ButtonWithArrow composes base button", () => {
    const ButtonWithArrow = require("../../app/components/ButtonWithArrow").default;
    render(<ButtonWithArrow href="/docs">Docs</ButtonWithArrow>);
    const btn = screen.getByRole("button", { name: /docs/i });
    expect(btn).toHaveClass("flex items-center gap-2", { exact: false });
  });

  test("MicrosoftClarity outputs script", () => {
    const MicrosoftClarity = require("../../app/components/MicrosoftClarity").default;
    const { container } = render(<MicrosoftClarity clarityId="abc123" />);
    const script = container.querySelector("script#microsoft-clarity");
    expect(script).toBeTruthy();
    expect(script?.textContent).toContain("clarity");
  });

  test("Navbar shows login/register when unauthenticated", () => {
    const Navbar = require("../../app/components/Navbar").default;
    render(<Navbar />);
    fireEvent.click(screen.getByRole("button", { name: /Masuk/i }));
    expect(mockRouterPush).toHaveBeenCalledWith("/login");
    fireEvent.click(screen.getByRole("button", { name: /Register/i }));
    expect(mockRouterPush).toHaveBeenCalledWith("/register");
    const beranda = screen.getByRole("link", { name: "Beranda" });
    expect(beranda.className).toMatch(/font-bold/);
  });

  test("Navbar renders profile controls for authenticated user", () => {
    const logout = jest.fn();
    mockUseAuth.mockReturnValue({ user: { name: "Rina", role: "ADMIN" }, logout });
    const Navbar = require("../../app/components/Navbar").default;
    render(<Navbar />);

    fireEvent.click(screen.getByLabelText(/Pengaturan profil/i));
    const settingsButtons = screen.getAllByRole("button", { name: /Pengaturan/i });
    fireEvent.click(settingsButtons[settingsButtons.length - 1]);
    expect(screen.getByTestId("password-settings")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Keluar/i }));
    expect(logout).toHaveBeenCalled();
  });
});

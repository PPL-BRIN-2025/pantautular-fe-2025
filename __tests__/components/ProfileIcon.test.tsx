import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ProfileIcon } from '../../app/components/Navbar';

type DropdownCtx = { isOpen: boolean; toggle: () => void };

// Mock DropdownMenu primitives used by ProfileIcon
jest.mock('../../app/components/ui-profile/dropdown-menu', () => {
  const React = require('react');

  const DropdownContext = React.createContext<DropdownCtx>({
    isOpen: false,
    toggle: () => {},
  });

  const DropdownMenu = ({ children }: { children: React.ReactNode }) => {
    const [isOpen, setIsOpen] = React.useState(false);
    const toggle = React.useCallback(() => setIsOpen((prev) => !prev), []);
    return (
      <DropdownContext.Provider value={{ isOpen, toggle }}>
        <div data-testid="dropdown-root">{children}</div>
      </DropdownContext.Provider>
    );
  };

  const DropdownMenuTrigger = ({ children, onClick, ...props }: any) => {
    const ctx = React.useContext(DropdownContext);
    return (
      <button
        type="button"
        {...props}
        onClick={(event: React.MouseEvent<HTMLButtonElement>) => {
          onClick?.(event);
          ctx.toggle();
        }}
      >
        {children}
      </button>
    );
  };

  const DropdownMenuContent = ({ children, ...props }: any) => {
    const ctx = React.useContext(DropdownContext);
    if (!ctx.isOpen) return null;
    return (
      <div role="menu" data-testid="dropdown-content" {...props}>
        {children}
      </div>
    );
  };

  const DropdownMenuItem = ({ children, onClick, ...props }: any) => (
    <button type="button" onClick={onClick} {...props}>
      {children}
    </button>
  );

  return {
    __esModule: true,
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
  };
});

jest.mock('../../app/components/password-settings', () => ({
  __esModule: true,
  default: ({ onClose }: { onClose: () => void }) => (
    <div data-testid="password-settings">
      Password Settings
      <button onClick={onClose}>Tutup Pengaturan</button>
    </div>
  ),
}));

describe('ProfileIcon Component', () => {
  const mockLogout = jest.fn();

  beforeEach(() => {
    mockLogout.mockClear();
  });

  it('renders user icon button', () => {
    render(<ProfileIcon logoutAction={mockLogout} />);
    const userIcon = screen.getByRole('button', { name: /Pengaturan profil/i });
    expect(userIcon).toBeInTheDocument();
    expect(userIcon).toHaveClass('flex items-center justify-center w-10 h-10 rounded-full bg-gray-300 shadow-md ml-8');
    expect(userIcon).toHaveAttribute('title', 'Pengaturan profil');
  });

  it('shows dropdown menu when clicked', () => {
    render(<ProfileIcon logoutAction={mockLogout} />);
    const userIcon = screen.getByRole('button', { name: /Pengaturan profil/i });
    fireEvent.click(userIcon);

    const menu = screen.getByTestId('dropdown-content');
    expect(menu).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Pengaturan$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Keluar$/i })).toBeInTheDocument();
  });

  it('calls logout when logout option is clicked', () => {
    render(<ProfileIcon logoutAction={mockLogout} />);
    const userIcon = screen.getByRole('button', { name: /Pengaturan profil/i });
    fireEvent.click(userIcon);

    const logoutOption = screen.getByRole('button', { name: /^Keluar$/i });
    fireEvent.click(logoutOption);

    expect(mockLogout).toHaveBeenCalled();
  });

  it('opens and closes password settings when Pengaturan is selected', () => {
    render(<ProfileIcon logoutAction={mockLogout} />);
    const userIcon = screen.getByRole('button', { name: /Pengaturan profil/i });
    fireEvent.click(userIcon);

    const settingsButton = screen.getByRole('button', { name: /^Pengaturan$/i });
    fireEvent.click(settingsButton);

    expect(screen.getByTestId('password-settings')).toBeInTheDocument();

    fireEvent.click(screen.getByText(/Tutup Pengaturan/i));
    expect(screen.queryByTestId('password-settings')).not.toBeInTheDocument();
  });
});

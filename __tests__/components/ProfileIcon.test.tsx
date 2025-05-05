import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ProfileIcon } from '../../app/components/Navbar';

// Mock Radix UI dropdown menu components
jest.mock('@radix-ui/react-dropdown-menu', () => ({
  Root: ({ children }: { children: React.ReactNode }) => <div role="menu">{children}</div>,
  Trigger: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <button 
      className={className}
      role="menuitem"
      tabIndex={0}
      aria-haspopup="true"
      aria-expanded="false"
      aria-label="User menu"
    >
      <svg
        className="lucide lucide-user h-6 w-6"
        fill="none"
        height="24"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        viewBox="0 0 24 24"
        width="24"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        role="img"
        aria-label="User icon"
      >
        <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    </button>
  ),
  Content: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div 
      className={className}
      role="menu"
      aria-orientation="vertical"
      aria-label="User menu options"
    >
      {children}
    </div>
  ),
  Item: ({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) => (
    <button 
      onClick={onClick}
      role="menuitem"
      tabIndex={0}
    >
      {children}
    </button>
  ),
  Portal: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

describe('ProfileIcon Component', () => {
  const mockLogout = jest.fn();

  beforeEach(() => {
    mockLogout.mockClear();
  });

  it('renders user icon button', () => {
    render(<ProfileIcon logout={mockLogout} />);
    const userIcon = screen.getByRole('menuitem', { name: 'User menu' });
    expect(userIcon).toBeInTheDocument();
    expect(userIcon).toHaveClass('flex items-center justify-center w-10 h-10 rounded-full bg-gray-300 shadow-md ml-8');
    expect(userIcon).toHaveAttribute('aria-haspopup', 'true');
  });

  it('shows dropdown menu when clicked', () => {
    render(<ProfileIcon logout={mockLogout} />);
    const userIcon = screen.getByRole('menuitem', { name: 'User menu' });
    fireEvent.click(userIcon);

    const menu = screen.getByRole('menu', { name: 'User menu options' });
    expect(menu).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: 'Pengaturan' })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: 'Keluar' })).toBeInTheDocument();
  });

  it('calls logout when logout option is clicked', () => {
    render(<ProfileIcon logout={mockLogout} />);
    const userIcon = screen.getByRole('menuitem', { name: 'User menu' });
    fireEvent.click(userIcon);

    const logoutOption = screen.getByRole('menuitem', { name: 'Keluar' });
    fireEvent.click(logoutOption);

    expect(mockLogout).toHaveBeenCalled();
  });
});
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ProfileIcon } from '../../app/components/Navbar';

// Mock Radix UI dropdown menu components
jest.mock('@radix-ui/react-dropdown-menu', () => ({
  Root: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Trigger: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <button className={className}>{children}</button>
  ),
  Content: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div className={className}>{children}</div>
  ),
  Item: ({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) => (
    <div onClick={onClick}>{children}</div>
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
    const userIcon = screen.getByRole('button');
    expect(userIcon).toBeInTheDocument();
    expect(userIcon).toHaveClass('flex items-center justify-center w-10 h-10 rounded-full bg-gray-300 shadow-md ml-8');
  });

  it('shows dropdown menu when clicked', () => {
    render(<ProfileIcon logout={mockLogout} />);
    const userIcon = screen.getByRole('button');
    fireEvent.click(userIcon);

    expect(screen.getByText('Pengaturan')).toBeInTheDocument();
    expect(screen.getByText('Keluar')).toBeInTheDocument();
  });

  it('calls logout when logout option is clicked', () => {
    render(<ProfileIcon logout={mockLogout} />);
    const userIcon = screen.getByRole('button');
    fireEvent.click(userIcon);

    const logoutOption = screen.getByText('Keluar');
    fireEvent.click(logoutOption);

    expect(mockLogout).toHaveBeenCalled();
  });
});
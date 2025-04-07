import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import DashboardButton from '../../../../app/components/floating_buttons/DashboardButton';

// Mock Next.js navigation hooks
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
  usePathname: () => '/some-path',
}));

describe('DashboardButton', () => {
  // Test default rendering
  it('renders with default props', () => {
    render(<DashboardButton />);
    
    const button = screen.getByTestId('dashboard-btn');
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute('aria-label', 'Chart Button');
    expect(button).not.toBeDisabled();
    
    // Check default styling (medium size)
    expect(button).toHaveClass('w-10 h-10');
    
    // Default state should be inactive (white background)
    expect(button).toHaveClass('bg-white');
    expect(button).not.toHaveClass('bg-blue-600');
    
    // Check for focus and transition classes
    expect(button).toHaveClass('focus:outline-none', 'focus:ring-2', 'focus:ring-gray-300', 'transition-colors', 'duration-200');
    
    // Check for shadow
    expect(button).toHaveClass('shadow-sm');
  });

  // Test with custom label
  it('renders with custom label', () => {
    render(<DashboardButton label="Custom Label" />);
    
    const button = screen.getByTestId('dashboard-btn');
    expect(button).toHaveAttribute('aria-label', 'Custom Label');
  });

  // Test small size
  it('renders with small size', () => {
    render(<DashboardButton size="small" />);
    
    const button = screen.getByTestId('dashboard-btn');
    expect(button).toHaveClass('h-8 w-8');
    
    // Check the SVG size
    const svg = button.querySelector('svg');
    expect(svg).toHaveAttribute('width', '20');
    expect(svg).toHaveAttribute('height', '20');
  });

  // Test large size
  it('renders with large size', () => {
    render(<DashboardButton size="large" />);
    
    const button = screen.getByTestId('dashboard-btn');
    expect(button).toHaveClass('h-16 w-16');
    
    // Check the SVG size
    const svg = button.querySelector('svg');
    expect(svg).toHaveAttribute('width', '28');
    expect(svg).toHaveAttribute('height', '28');
  });

  // Test disabled state
  it('renders in disabled state', () => {
    render(<DashboardButton disabled={true} />);
    
    const button = screen.getByTestId('dashboard-btn');
    expect(button).toBeDisabled();
  });

  // Test custom className
  it('renders with custom className', () => {
    const customClass = 'my-custom-class';
    render(<DashboardButton className={customClass} />);
    
    const button = screen.getByTestId('dashboard-btn');
    expect(button).toHaveClass(customClass);
  });

  // Test active state based on pathname
  it('renders in active state when on dashboard page', () => {
    // Mock usePathname to return /dashboard
    jest.spyOn(require('next/navigation'), 'usePathname').mockReturnValue('/dashboard');
    
    render(<DashboardButton />);
    const button = screen.getByTestId('dashboard-btn');
    const path = button.querySelector('path');
    
    expect(button).toHaveClass('bg-blue-600');
    expect(path).toHaveAttribute('fill', 'white');
  });

  // Test click behavior
  it('calls router.push and onClick when clicked', () => {
    const mockPush = jest.fn();
    const mockOnClick = jest.fn();
    
    // Mock useRouter to return our mock push function
    jest.spyOn(require('next/navigation'), 'useRouter').mockReturnValue({
      push: mockPush,
    });
    
    render(<DashboardButton onClick={mockOnClick} />);
    
    const button = screen.getByTestId('dashboard-btn');
    fireEvent.click(button);
    
    expect(mockPush).toHaveBeenCalledWith('/dashboard');
    expect(mockOnClick).toHaveBeenCalled();
  });

  // Test that click handlers are not called when disabled
  it('does not call handlers when disabled', () => {
    const mockPush = jest.fn();
    const mockOnClick = jest.fn();
    
    jest.spyOn(require('next/navigation'), 'useRouter').mockReturnValue({
      push: mockPush,
    });
    
    render(<DashboardButton onClick={mockOnClick} disabled={true} />);
    
    const button = screen.getByTestId('dashboard-btn');
    fireEvent.click(button);
    
    expect(mockPush).not.toHaveBeenCalled();
    expect(mockOnClick).not.toHaveBeenCalled();
  });

  // Test hover and active states
  it('has correct hover and active classes', () => {
    render(<DashboardButton />);
    
    const buttonContent = screen.getByTestId('dashboard-btn').firstChild;
    expect(buttonContent).toHaveClass(
      'group-hover:scale-110',
      'group-active:scale-95',
      'transition-transform',
      'duration-200'
    );
  });
});
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MapButton } from '../../../../app/components/floating_buttons/MapButton';
import { useRouter, usePathname } from 'next/navigation';

// Mock Next.js navigation hooks
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  usePathname: jest.fn()
}));

// Mock useAuth hook
jest.mock('../../../../app/auth/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: "1", name: "Test User" },
    isAuthenticated: true,
    login: jest.fn(),
    logout: jest.fn(),
  })
}));

// Mock child components
jest.mock('../../../../app/components/floating_buttons/SeverityButton', () => ({
  __esModule: true,
  default: ({ size }: { size: string }) => (
    <button data-testid="severity-button" data-size={size}>Severity</button>
  )
}));

jest.mock('../../../../app/components/floating_buttons/TemperatureButton', () => ({
  __esModule: true,
  default: ({ size }: { size: string }) => (
    <button data-testid="temperature-button" data-size={size}>Temperature</button>
  )
}));

jest.mock('../../../../app/components/floating_buttons/HumidityButton', () => ({
  __esModule: true,
  default: ({ size }: { size: string }) => (
    <button data-testid="humidity-button" data-size={size}>Humidity</button>
  )
}));

jest.mock('../../../../app/components/floating_buttons/RainButton', () => ({
  __esModule: true,
  default: ({ size }: { size: string }) => (
    <button data-testid="rain-button" data-size={size}>Rain</button>
  )
}));

describe('MapButton', () => {
  const mockPush = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
    (usePathname as jest.Mock).mockReturnValue('/');
  });

  it('renders with default props', () => {
    render(<MapButton />);
    const button = screen.getByRole('button', { name: /map/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass('w-10 h-10'); // Default medium size
  });

  it('renders with small size', () => {
    render(<MapButton size="small" />);
    const button = screen.getByRole('button', { name: /map/i });
    expect(button).toHaveClass('w-8 h-8');
  });

  it('renders with medium size', () => {
    render(<MapButton size="medium" />);
    const button = screen.getByRole('button', { name: /map/i });
    expect(button).toHaveClass('w-10 h-10');
  });

  it('renders with large size', () => {
    render(<MapButton size="large" />);
    const button = screen.getByRole('button', { name: /map/i });
    expect(button).toHaveClass('w-16 h-16');
  });

  it('applies custom className', () => {
    render(<MapButton className="custom-class" />);
    const button = screen.getByRole('button', { name: /map/i });
    expect(button).toHaveClass('custom-class');
  });

  it('shows additional buttons when clicked', () => {
    render(<MapButton />);
    const button = screen.getByRole('button', { name: /map/i });
    fireEvent.click(button);
    
    // Check if additional buttons are rendered
    expect(screen.getByTestId('severity-button')).toBeInTheDocument();
    expect(screen.getByTestId('temperature-button')).toBeInTheDocument();
    expect(screen.getByTestId('humidity-button')).toBeInTheDocument();
    expect(screen.getByTestId('rain-button')).toBeInTheDocument();
  });

  it('renders with correct container structure', () => {
    render(<MapButton />);
    const container = screen.getByRole('button', { name: /map/i }).parentElement;
    expect(container).toHaveClass('relative flex flex-col items-center');
  });

  it('renders SVG with correct attributes', () => {
    render(<MapButton />);
    const svg = screen.getByRole('button', { name: /map/i }).querySelector('svg');
    expect(svg).toHaveAttribute('width', '20'); // Medium size default
    expect(svg).toHaveAttribute('height', '30'); // 1.5x the width
  });

  it('renders in active state when on map page', () => {
    (usePathname as jest.Mock).mockReturnValue('/map');
    render(<MapButton />);
    const button = screen.getByRole('button', { name: /map/i });
    expect(button).toHaveClass('bg-blue-600');
  });

  it('calls router.push when clicked', () => {
    render(<MapButton />);
    const button = screen.getByRole('button', { name: /map/i });
    fireEvent.click(button);
    expect(mockPush).toHaveBeenCalledWith('/map');
  });

  it('does not show additional buttons when user is not authenticated', () => {
    // Mock useAuth to return no user
    jest.spyOn(require('../../../../app/auth/hooks/useAuth'), 'useAuth')
      .mockReturnValue({ user: null, isAuthenticated: false });
    
    render(<MapButton />);
    const button = screen.getByRole('button', { name: /map/i });
    fireEvent.click(button);
    
    // Additional buttons should not be present
    expect(screen.queryByTestId('severity-button')).not.toBeInTheDocument();
    expect(screen.queryByTestId('temperature-button')).not.toBeInTheDocument();
    expect(screen.queryByTestId('humidity-button')).not.toBeInTheDocument();
    expect(screen.queryByTestId('rain-button')).not.toBeInTheDocument();
  });
});
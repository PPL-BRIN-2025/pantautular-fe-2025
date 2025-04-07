import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MapButton } from '../../../../app/components/floating_buttons/MapButton';

// Mock Next.js navigation hooks
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
  usePathname: () => '/some-path',
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
  // Test default rendering
  test('renders with default props', () => {
    render(<MapButton />);
    
    const button = screen.getByRole('button', { name: 'Map' });
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass('bg-white'); // Default state
    expect(button).toHaveClass('w-10 h-10'); // Default size is medium
    expect(button).toHaveAttribute('aria-pressed', 'false');
    
    // Check for transition classes
    expect(button).toHaveClass('transition-colors', 'duration-200');
    
    // Additional buttons should not be visible initially
    expect(screen.queryByTestId('severity-button')).not.toBeInTheDocument();
    expect(screen.queryByTestId('temperature-button')).not.toBeInTheDocument();
    expect(screen.queryByTestId('humidity-button')).not.toBeInTheDocument();
    expect(screen.queryByTestId('rain-button')).not.toBeInTheDocument();
  });

  // Test different size props
  test.each([
    ['small', 'w-8 h-8', 16, 24],
    ['medium', 'w-10 h-10', 20, 30],
    ['large', 'w-16 h-16', 24, 36],
  ])('renders with %s size', (size, expectedButtonClass, expectedIconWidth, expectedIconHeight) => {
    render(<MapButton size={size as 'small' | 'medium' | 'large'} />);
    
    const button = screen.getByRole('button');
    expect(button).toHaveClass(expectedButtonClass);
    
    const svg = document.querySelector('svg');
    expect(svg).toHaveAttribute('width', expectedIconWidth.toString());
    expect(svg).toHaveAttribute('height', expectedIconHeight.toString());
  });

  // Test custom className prop
  test('applies custom className', () => {
    render(<MapButton className="test-custom-class" />);
    
    const button = screen.getByRole('button');
    expect(button).toHaveClass('test-custom-class');
  });

  // Test clicking the button shows additional buttons
  test('shows additional buttons when clicked', () => {
    render(<MapButton />);
    
    const button = screen.getByRole('button');
    
    // Initially additional buttons are not visible
    expect(screen.queryByTestId('severity-button')).not.toBeInTheDocument();
    
    // Click the button
    fireEvent.click(button);
    
    // Button state should change
    expect(button).toHaveClass('bg-blue-600');
    expect(button).toHaveAttribute('aria-pressed', 'true');
    
    // Path fill color should change
    const path = document.querySelector('path');
    expect(path).toHaveAttribute('fill', 'white');
    
    // Additional buttons should now be visible
    expect(screen.getByTestId('severity-button')).toBeInTheDocument();
    expect(screen.getByTestId('temperature-button')).toBeInTheDocument();
    expect(screen.getByTestId('humidity-button')).toBeInTheDocument();
    expect(screen.getByTestId('rain-button')).toBeInTheDocument();
    
    // Additional buttons should have size="sm"
    expect(screen.getByTestId('severity-button')).toHaveAttribute('data-size', 'sm');
    expect(screen.getByTestId('temperature-button')).toHaveAttribute('data-size', 'sm');
    expect(screen.getByTestId('humidity-button')).toHaveAttribute('data-size', 'sm');
    expect(screen.getByTestId('rain-button')).toHaveAttribute('data-size', 'sm');
  });

  // Test container class and positioning
  test('renders with correct container and positioning classes', () => {
    render(<MapButton />);
    
    // Check main container
    const mainContainer = screen.getByRole('button').parentElement;
    expect(mainContainer).toHaveClass('relative', 'flex', 'flex-col', 'items-center');
    
    // Click to show additional buttons
    fireEvent.click(screen.getByRole('button'));
    
    // Check additional buttons container
    const additionalButtonsContainer = screen.getByTestId('severity-button').parentElement;
    expect(additionalButtonsContainer).toHaveClass('absolute', 'top-[3.5rem]', 'flex', 'flex-col', 'gap-2', 'items-center');
  });

  // Test SVG rendering and attributes
  test('renders SVG with correct attributes', () => {
    render(<MapButton />);
    
    const svg = document.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute('viewBox', '0 0 20 20');
    expect(svg).toHaveAttribute('xmlns', 'http://www.w3.org/2000/svg');
    expect(svg).toHaveClass('transition-colors', 'duration-200');
    
    const path = document.querySelector('path');
    expect(path).toHaveAttribute('fill-rule', 'evenodd');
    expect(path).toHaveAttribute('clip-rule', 'evenodd');
    expect(path).toHaveAttribute('fill', 'black'); // Default state
  });

  // Test active state based on pathname
  test('renders in active state when on map page', () => {
    // Mock usePathname to return /map
    jest.spyOn(require('next/navigation'), 'usePathname').mockReturnValue('/map');
    
    render(<MapButton />);
    const button = screen.getByRole('button');
    const path = document.querySelector('path');
    
    expect(button).toHaveClass('bg-blue-600');
    expect(path).toHaveAttribute('fill', 'white');
  });

  // Test router.push is called on click
  test('calls router.push when clicked', () => {
    const mockPush = jest.fn();
    jest.spyOn(require('next/navigation'), 'useRouter').mockReturnValue({
      push: mockPush,
    });
    
    render(<MapButton />);
    fireEvent.click(screen.getByRole('button'));
    
    expect(mockPush).toHaveBeenCalledWith('/map');
  });
});
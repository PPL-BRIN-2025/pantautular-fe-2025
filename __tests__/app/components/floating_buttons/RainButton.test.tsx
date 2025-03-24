import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import RainButton from '../../../../app/components/floating_buttons/RainButton';

describe('RainButton', () => {
  // Test default rendering
  test('renders with default props', () => {
    render(<RainButton />);
    
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass('bg-white');
    expect(button).toHaveClass('text-blue-600');
    expect(button).toHaveClass('border');
    expect(button).toHaveClass('border-gray-200');
    expect(button).toHaveClass('h-12 w-12'); // Default size is md
    expect(button).toHaveAttribute('aria-pressed', 'false');
  });

  // Test different size props
  test.each([
    ['sm', 'h-10 w-10', 16],
    ['md', 'h-12 w-12', 20],
    ['lg', 'h-16 w-16', 24],
  ])('renders with %s size', (size, expectedClass, expectedIconSize) => {
    render(<RainButton size={size as 'sm' | 'md' | 'lg'} />);
    
    const button = screen.getByRole('button');
    expect(button).toHaveClass(expectedClass);
    
    const svg = document.querySelector('svg');
    expect(svg).toHaveAttribute('width', expectedIconSize.toString());
    expect(svg).toHaveAttribute('height', expectedIconSize.toString());
  });

  // Test custom className prop
  test('applies custom className', () => {
    render(<RainButton className="test-custom-class" />);
    
    const button = screen.getByRole('button');
    expect(button).toHaveClass('test-custom-class');
  });

  // Test button state toggle
  test('toggles active state on click', () => {
    render(<RainButton />);
    
    const button = screen.getByRole('button');
    
    // Initial state
    expect(button).toHaveClass('bg-white');
    expect(button).toHaveClass('text-blue-600');
    expect(button).toHaveAttribute('aria-pressed', 'false');
    
    // Click to activate
    fireEvent.click(button);
    
    // After first click
    expect(button).toHaveClass('bg-blue-600');
    expect(button).toHaveClass('text-white');
    expect(button).toHaveAttribute('aria-pressed', 'true');
    
    // Click to deactivate
    fireEvent.click(button);
    
    // After second click
    expect(button).toHaveClass('bg-white');
    expect(button).toHaveClass('text-blue-600');
    expect(button).toHaveAttribute('aria-pressed', 'false');
  });

  // Test onClick callback
  test('calls onClick callback when clicked', () => {
    const mockOnClick = jest.fn();
    render(<RainButton onClick={mockOnClick} />);
    
    const button = screen.getByRole('button');
    
    // Click button
    fireEvent.click(button);
    expect(mockOnClick).toHaveBeenCalledTimes(1);
    
    // Click again
    fireEvent.click(button);
    expect(mockOnClick).toHaveBeenCalledTimes(2);
  });

  // Test SVG path fill color changes with state
  test('changes SVG fill color based on active state', () => {
    render(<RainButton />);
    
    const button = screen.getByRole('button');
    const path = document.querySelector('path');
    
    // Check initial state (inactive)
    expect(path).toHaveAttribute('fill', 'currentColor');
    
    // Click to activate
    fireEvent.click(button);
    
    // Check active state
    expect(path).toHaveAttribute('fill', 'white');
  });

  // Test with undefined onClick handler (branch coverage)
  test('works without onClick handler', () => {
    render(<RainButton onClick={undefined} />);
    
    const button = screen.getByRole('button');
    
    // Should not throw an error when clicked
    expect(() => {
      fireEvent.click(button);
    }).not.toThrow();
    
    // State should still change
    expect(button).toHaveClass('bg-blue-600');
    expect(button).toHaveClass('text-white');
    expect(button).toHaveAttribute('aria-pressed', 'true');
  });

  // Test transition classes
  test('has appropriate transition classes', () => {
    render(<RainButton />);
    
    const button = screen.getByRole('button');
    expect(button).toHaveClass('transition-colors');
    expect(button).toHaveClass('duration-300');
    
    const svg = document.querySelector('svg');
    expect(svg).toHaveClass('transition-colors');
    expect(svg).toHaveClass('duration-300');
  });

  // Test SVG structure and viewBox
  test('renders SVG with correct viewBox and structure', () => {
    render(<RainButton />);
    
    const svg = document.querySelector('svg');
    expect(svg).toHaveAttribute('viewBox', '0 0 12 14');
    expect(svg).toHaveAttribute('xmlns', 'http://www.w3.org/2000/svg');
    
    const path = document.querySelector('path');
    expect(path).toBeInTheDocument();
    expect(path).toHaveAttribute('d', expect.stringContaining('M6 14C7.39239 14'));
  });
});
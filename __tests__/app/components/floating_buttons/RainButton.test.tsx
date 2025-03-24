import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import RainButton from '../../../../app/components/floating_buttons/RainButton';

// Helper function to check button's state and classes
const checkButtonState = (
  button: HTMLElement,
  expectedClasses: string[],
  expectedAriaPressed: string
) => {
  expectedClasses.forEach(className => {
    expect(button).toHaveClass(className);
  });
  expect(button).toHaveAttribute('aria-pressed', expectedAriaPressed);
};

// Helper function to check SVG properties
const checkSVGState = (svg: SVGElement, expectedSize: number) => {
  expect(svg).toHaveAttribute('width', expectedSize.toString());
  expect(svg).toHaveAttribute('height', expectedSize.toString());
};

describe('RainButton', () => {
  // Test default rendering
  test('renders with default props', () => {
    render(<RainButton />);
    
    const button = screen.getByRole('button');
    checkButtonState(button, ['bg-white', 'text-blue-600', 'border', 'border-gray-200', 'h-12', 'w-12'], 'false');
    
    const svg = document.querySelector('svg');
    checkSVGState(svg, 20); // Default icon size for md
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
    checkSVGState(svg, expectedIconSize);
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
    checkButtonState(button, ['bg-white', 'text-blue-600'], 'false');
    
    // Click to activate
    fireEvent.click(button);
    checkButtonState(button, ['bg-blue-600', 'text-white'], 'true');
    
    // Click to deactivate
    fireEvent.click(button);
    checkButtonState(button, ['bg-white', 'text-blue-600'], 'false');
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
    checkButtonState(button, ['bg-blue-600', 'text-white'], 'true');
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

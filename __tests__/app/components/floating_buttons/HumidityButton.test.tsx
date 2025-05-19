import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import HumidityButton from '../../../../app/components/floating_buttons/HumidityButton';

// Helper function to check button's class and aria-pressed state
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

describe('HumidityButton', () => {
  // Test default rendering
  test('renders with default props', () => {
    render(<HumidityButton />);
    
    const button = screen.getByRole('button', { name: 'Toggle humidity map view' });
    checkButtonState(button, ['bg-white', 'text-teal-500', 'h-12', 'w-12'], 'false');
  });

  // Test different size props
  test.each([
    ['sm', 'h-10 w-10'],
    ['md', 'h-12 w-12'],
    ['lg', 'h-16 w-16'],
  ])('renders with %s size', (size, expectedClass) => {
    render(<HumidityButton size={size as 'sm' | 'md' | 'lg'} />);
    
    const button = screen.getByRole('button');
    expect(button).toHaveClass(expectedClass);
  });

  // Test custom className prop
  test('applies custom className', () => {
    render(<HumidityButton className="test-custom-class" />);
    
    const button = screen.getByRole('button');
    expect(button).toHaveClass('test-custom-class');
  });

  // Test button state toggle
  test('toggles active state on click', () => {
    render(<HumidityButton />);
    
    const button = screen.getByRole('button');
    
    // Initial state
    checkButtonState(button, ['bg-white', 'text-teal-500', 'h-12', 'w-12'], 'false');
    
    // Click to activate
    fireEvent.click(button);
    checkButtonState(button, ['bg-teal-500', 'text-white'], 'true');
    
    // Click to deactivate
    fireEvent.click(button);
    checkButtonState(button, ['bg-white', 'text-teal-500'], 'false');
  });

  // Test onClick callback
  test('calls onClick callback when clicked', () => {
    const mockOnClick = jest.fn();
    render(<HumidityButton onClick={mockOnClick} />);
    
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
    render(<HumidityButton />);
    
    const button = screen.getByRole('button');
    const paths = document.querySelectorAll('path');
    
    // Check initial state (inactive)
    paths.forEach(path => {
      expect(path).toHaveAttribute('fill', 'currentColor');
    });
    
    // Click to activate
    fireEvent.click(button);
    
    // Check active state
    paths.forEach(path => {
      expect(path).toHaveAttribute('fill', 'white');
    });
  });

  // Test correct icon sizes based on button size
  test.each([
    ['sm', 16],
    ['md', 20],
    ['lg', 24],
  ])('applies correct icon size for %s button', (size, expectedSize) => {
    render(<HumidityButton size={size as 'sm' | 'md' | 'lg'} />);
    
    const svg = document.querySelector('svg');
    expect(svg).toHaveAttribute('width', expectedSize.toString());
    expect(svg).toHaveAttribute('height', expectedSize.toString());
  });

  // Test with undefined onClick handler (branch coverage)
  test('works without onClick handler', () => {
    render(<HumidityButton onClick={undefined} />);
    
    const button = screen.getByRole('button');
    
    // Should not throw an error when clicked
    expect(() => {
      fireEvent.click(button);
    }).not.toThrow();
  });

  test('shows and hides tooltip on hover', () => {
  render(<HumidityButton />);
  const button = screen.getByRole('button');

  // Tooltip belum muncul
  expect(screen.queryByText(/Peta Tematik: Kelembaban/i)).not.toBeInTheDocument();

  // Hover: tooltip muncul
  fireEvent.mouseEnter(button);
  expect(screen.getByText(/Peta Tematik: Kelembaban/i)).toBeInTheDocument();

  // Unhover: tooltip hilang
  fireEvent.mouseLeave(button);
  expect(screen.queryByText(/Peta Tematik: Kelembaban/i)).not.toBeInTheDocument();
});
  
});

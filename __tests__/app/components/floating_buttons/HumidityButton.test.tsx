import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import HumidityButton from '../../../../app/components/floating_buttons/HumidityButton';

describe('HumidityButton', () => {
  // Test default rendering
  test('renders with default props', () => {
    render(<HumidityButton />);
    
    const button = screen.getByRole('button', { name: 'Toggle humidity map view' });
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass('bg-white');
    expect(button).toHaveClass('text-teal-500');
    expect(button).toHaveClass('h-12 w-12'); // Default size is md
    expect(button).toHaveAttribute('aria-pressed', 'false');
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
    expect(button).toHaveClass('bg-white');
    expect(button).toHaveClass('text-teal-500');
    expect(button).toHaveAttribute('aria-pressed', 'false');
    
    // Click to activate
    fireEvent.click(button);
    
    // After first click
    expect(button).toHaveClass('bg-teal-500');
    expect(button).toHaveClass('text-white');
    expect(button).toHaveAttribute('aria-pressed', 'true');
    
    // Click to deactivate
    fireEvent.click(button);
    
    // After second click
    expect(button).toHaveClass('bg-white');
    expect(button).toHaveClass('text-teal-500');
    expect(button).toHaveAttribute('aria-pressed', 'false');
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
});
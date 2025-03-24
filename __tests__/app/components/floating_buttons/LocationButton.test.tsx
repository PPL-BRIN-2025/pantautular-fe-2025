import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import LocationButton from '../../../../app/components/floating_buttons/LocationButton';

// Mock the lucide-react MapPin component
jest.mock('lucide-react', () => ({
  MapPin: ({ className }: { className: string }) => (
    <div data-testid="map-pin-icon" className={className} />
  ),
}));

describe('LocationButton', () => {
  // Test default rendering
  test('renders with default props', () => {
    render(<LocationButton />);
    
    const button = screen.getByRole('button', { name: 'Location' });
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass('bg-white');
    expect(button).toHaveClass('hover:bg-gray-100');
    expect(button).toHaveClass('w-10 h-10'); // Default size is md
    
    const icon = screen.getByTestId('map-pin-icon');
    expect(icon).toHaveClass('text-primary');
    expect(icon).toHaveClass('w-6 h-6'); // Default icon size
  });

  // Test different size props
  test.each([
    ['sm', 'w-8 h-8', 'w-4 h-4'],
    ['md', 'w-10 h-10', 'w-6 h-6'],
    ['lg', 'w-16 h-16', 'w-8 h-8'],
  ])('renders with %s size', (size, expectedButtonClass, expectedIconClass) => {
    render(<LocationButton size={size as 'sm' | 'md' | 'lg'} />);
    
    const button = screen.getByRole('button');
    expect(button).toHaveClass(expectedButtonClass);
    
    const icon = screen.getByTestId('map-pin-icon');
    expect(icon).toHaveClass(expectedIconClass);
  });

  // Test different variant props
  test.each([
    ['default', 'bg-white hover:bg-gray-100 text-black shadow-sm'],
    ['outline', 'border border-gray-300 hover:bg-gray-50 text-black'],
  ])('renders with %s variant', (variant, expectedClass) => {
    render(<LocationButton variant={variant as 'default' | 'outline'} />);
    
    const button = screen.getByRole('button');
    const classes = expectedClass.split(' ');
    
    classes.forEach(cls => {
      expect(button).toHaveClass(cls);
    });
  });

  // Test custom className prop
  test('applies custom className', () => {
    render(<LocationButton className="test-custom-class" />);
    
    const button = screen.getByRole('button');
    expect(button).toHaveClass('test-custom-class');
  });

  // Test onClick callback
  test('calls onClick callback when clicked', () => {
    const mockOnClick = jest.fn();
    render(<LocationButton onClick={mockOnClick} />);
    
    const button = screen.getByRole('button');
    
    fireEvent.click(button);
    expect(mockOnClick).toHaveBeenCalledTimes(1);
  });

  // Test disabled state
  test('applies disabled attributes when disabled prop is true', () => {
    render(<LocationButton disabled />);
    
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    expect(button).toHaveClass('opacity-50');
    expect(button).toHaveClass('cursor-not-allowed');
  });

  // Test passing through additional HTML button attributes
  test('passes through additional button attributes', () => {
    render(
      <LocationButton 
        data-testid="test-button"
        type="submit"
        title="Location button title"
      />
    );
    
    const button = screen.getByTestId('test-button');
    expect(button).toHaveAttribute('type', 'submit');
    expect(button).toHaveAttribute('title', 'Location button title');
  });

  // Test disabling onClick when disabled
  test('does not call onClick when disabled', () => {
    const mockOnClick = jest.fn();
    render(<LocationButton onClick={mockOnClick} disabled />);
    
    const button = screen.getByRole('button');
    
    fireEvent.click(button);
    expect(mockOnClick).not.toHaveBeenCalled();
  });

  // Test focus styles are applied correctly
  test('applies focus styles', () => {
    render(<LocationButton />);
    
    const button = screen.getByRole('button');
    expect(button).toHaveClass('focus:ring-2');
    expect(button).toHaveClass('focus:ring-primary');
    expect(button).toHaveClass('focus:ring-offset-2');
  });
});
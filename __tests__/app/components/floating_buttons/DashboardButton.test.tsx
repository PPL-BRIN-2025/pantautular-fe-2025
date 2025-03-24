import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import DashboardButton from '../../../../app/components/floating_buttons/DashboardButton';

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

  // Test medium size
  it('renders with medium size', () => {
    render(<DashboardButton size="medium" />);
    
    const button = screen.getByTestId('dashboard-btn');
    expect(button).toHaveClass('w-10 h-10');
    
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
    render(<DashboardButton className="custom-class" />);
    
    const button = screen.getByTestId('dashboard-btn');
    expect(button).toHaveClass('custom-class');
  });

  // Test click behavior - active state toggle
  it('toggles active state on click', () => {
    render(<DashboardButton />);
    
    const button = screen.getByTestId('dashboard-btn');
    
    // Initial state
    expect(button).toHaveClass('bg-white');
    expect(button).not.toHaveClass('bg-blue-600');
    
    // Click to activate
    fireEvent.click(button);
    expect(button).not.toHaveClass('bg-white');
    expect(button).toHaveClass('bg-blue-600');
    
    // Path fill should change to white when active
    const path = button.querySelector('path');
    expect(path).toHaveAttribute('fill', 'white');
    
    // Click again to deactivate
    fireEvent.click(button);
    expect(button).toHaveClass('bg-white');
    expect(button).not.toHaveClass('bg-blue-600');
    
    // Path fill should change back to black when inactive
    expect(path).toHaveAttribute('fill', 'black');
  });

  // Test onClick callback is called
  it('calls onClick callback when clicked', () => {
    const handleClick = jest.fn();
    render(<DashboardButton onClick={handleClick} />);
    
    const button = screen.getByTestId('dashboard-btn');
    fireEvent.click(button);
    
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  // Test that onClick is not called when disabled
  it('does not call onClick when disabled', () => {
    const handleClick = jest.fn();
    render(<DashboardButton onClick={handleClick} disabled={true} />);
    
    const button = screen.getByTestId('dashboard-btn');
    fireEvent.click(button);
    
    expect(handleClick).not.toHaveBeenCalled();
  });

  // Test that active state is not toggled when disabled
  it('does not toggle active state when disabled', () => {
    render(<DashboardButton disabled={true} />);
    
    const button = screen.getByTestId('dashboard-btn');
    
    // Initial state
    expect(button).toHaveClass('bg-white');
    
    // Click should not change state when disabled
    fireEvent.click(button);
    expect(button).toHaveClass('bg-white');
    expect(button).not.toHaveClass('bg-blue-600');
  });

  // Test SVG rendering and icon color
  it('renders SVG with correct initial color', () => {
    render(<DashboardButton />);
    
    const button = screen.getByTestId('dashboard-btn');
    const path = button.querySelector('path');
    
    // Initial state should have black fill
    expect(path).toHaveAttribute('fill', 'black');
  });
});
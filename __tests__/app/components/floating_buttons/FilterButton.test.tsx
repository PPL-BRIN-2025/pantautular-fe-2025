import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import FilterButton from '../../../../app/components/floating_buttons/FilterButton';

describe('FilterButton', () => {
  // Test for combineClasses utility function
  describe('combineClasses utility', () => {
    it('should correctly combine class names and filter out falsy values', () => {
      // We'll test this indirectly by verifying classes on rendered button
      render(<FilterButton className={undefined} />);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('flex items-center gap-2 rounded-full');
      expect(button).toHaveClass('h-10 px-4 py-2 text-sm'); // md size default
      expect(button).not.toHaveClass('undefined');
    });
  });

  // Test default rendering
  it('renders with default props', () => {
    render(<FilterButton />);
    
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent('Filter');
    expect(button).toHaveClass('bg-white');
    expect(button).toHaveClass('text-black');
    expect(button).toHaveClass('h-10 px-4 py-2 text-sm'); // md size
    expect(button).toHaveAttribute('aria-label', 'Open filters');
    expect(button).not.toBeDisabled();
    
    const iconWrapper = button.querySelector('div');
    expect(iconWrapper).toHaveClass('bg-[#333333]');
    expect(iconWrapper).toHaveClass('h-7 w-7'); // md icon size
    
    // Default should show filter (three lines) icon, not close (X) icon
    const svg = button.querySelector('svg');
    expect(svg).toBeInTheDocument();
    const paths = button.querySelectorAll('path');
    expect(paths.length).toBe(3); // Filter icon has 3 lines/paths
  });

  // Test different size variants
  describe('size prop variations', () => {
    it('renders small size correctly', () => {
      render(<FilterButton size="sm" />);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('h-8 px-3 py-1 text-xs');
      
      const iconWrapper = button.querySelector('div');
      expect(iconWrapper).toHaveClass('h-5 w-5');
    });
    
    it('renders medium size correctly', () => {
      render(<FilterButton size="md" />);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('h-10 px-4 py-2 text-sm');
      
      const iconWrapper = button.querySelector('div');
      expect(iconWrapper).toHaveClass('h-7 w-7');
    });
    
    it('renders large size correctly', () => {
      render(<FilterButton size="lg" />);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('h-12 px-5 py-2.5 text-base');
      
      const iconWrapper = button.querySelector('div');
      expect(iconWrapper).toHaveClass('h-8 w-8');
    });
  });

  // Test different variant styles
  describe('variant prop variations', () => {
    it('renders default variant correctly when inactive', () => {
      render(<FilterButton variant="default" />);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-white text-black');
      expect(button).not.toHaveClass('border-2');
      
      const iconWrapper = button.querySelector('div');
      expect(iconWrapper).toHaveClass('bg-[#333333]');
    });
    
    it('renders default variant correctly when active', () => {
      render(<FilterButton variant="default" isActive={true} />);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-[#0066cc] text-white');
      expect(button).not.toHaveClass('border-2');
      
      const iconWrapper = button.querySelector('div');
      expect(iconWrapper).toHaveClass('bg-[#0066cc]');
    });
    
    it('renders outline variant correctly when inactive', () => {
      render(<FilterButton variant="outline" />);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('border-2 border-[#333333] bg-white text-black');
      
      const iconWrapper = button.querySelector('div');
      expect(iconWrapper).toHaveClass('bg-[#333333]');
    });
    
    it('renders outline variant correctly when active', () => {
      render(<FilterButton variant="outline" isActive={true} />);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('border-2 border-[#0066cc] bg-[#0066cc] text-white');
      
      const iconWrapper = button.querySelector('div');
      expect(iconWrapper).toHaveClass('bg-[#0066cc]');
    });
  });

  // Test disabled state
  it('renders in disabled state', () => {
    render(<FilterButton disabled={true} />);
    
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
  });

  // Test custom className
  it('renders with custom className', () => {
    render(<FilterButton className="test-custom-class" />);
    
    const button = screen.getByRole('button');
    expect(button).toHaveClass('test-custom-class');
  });

  // Test internal state toggle (when no external isActive is provided)
  it('toggles internal active state on click', () => {
    render(<FilterButton />);
    
    const button = screen.getByRole('button');
    
    // Initial state
    expect(button).toHaveClass('bg-white text-black');
    expect(button).toHaveAttribute('aria-label', 'Open filters');
    
    // Click to activate
    fireEvent.click(button);
    
    // Active state
    expect(button).toHaveClass('bg-[#0066cc] text-white');
    expect(button).toHaveAttribute('aria-label', 'Close filters');
    
    // Check if SVG changed to X icon (1 path instead of 3)
    const paths = button.querySelectorAll('path');
    expect(paths.length).toBe(1); // X icon has 1 path
    
    // Click again to deactivate
    fireEvent.click(button);
    
    // Back to inactive state
    expect(button).toHaveClass('bg-white text-black');
    expect(button).toHaveAttribute('aria-label', 'Open filters');
    
    // Check if SVG changed back to filter icon (3 paths)
    const pathsAfterToggle = button.querySelectorAll('path');
    expect(pathsAfterToggle.length).toBe(3);
  });

  // Test external isActive control
  it('does not toggle internal state when external isActive is provided', () => {
    const handleClick = jest.fn();
    render(<FilterButton isActive={false} onClick={handleClick} />);
    
    const button = screen.getByRole('button');
    
    // Initial state
    expect(button).toHaveClass('bg-white text-black');
    
    // Click should not change the styling since we're using external control
    fireEvent.click(button);
    
    // State should remain the same
    expect(button).toHaveClass('bg-white text-black');
    
    // But onClick should still be called
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  // Test onClick callback
  it('calls onClick callback when clicked', () => {
    const handleClick = jest.fn();
    render(<FilterButton onClick={handleClick} />);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
  
  // Test both icons rendering
  describe('icon rendering', () => {
    it('renders filter icon when inactive', () => {
      render(<FilterButton />);
      
      const button = screen.getByRole('button');
      const paths = button.querySelectorAll('path');
      
      // Filter icon has 3 horizontal lines
      expect(paths.length).toBe(3);
      paths.forEach(path => {
        expect(path).toHaveAttribute('stroke', 'white');
        expect(path).not.toHaveAttribute('strokeLinecap');
      });
    });
    
    it('renders close (X) icon when active', () => {
      render(<FilterButton isActive={true} />);
      
      const button = screen.getByRole('button');
      const path = button.querySelector('path');
      
      // Close icon has 1 path (X shape)
      expect(path).toHaveAttribute('fill', 'white');
    });
  });
  
  // Test spreading additional props
  it('passes additional props to the button element', () => {
    render(<FilterButton data-testid="test-button" title="Test Title" />);
    
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('data-testid', 'test-button');
    expect(button).toHaveAttribute('title', 'Test Title');
  });
});
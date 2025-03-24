import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import CaseDetailHeader from '../../app/components/case_detail/CaseDetailHeader';
import { FaTimesCircle } from "react-icons/fa";

// Mock the FaTimesCircle icon for easier testing
jest.mock("react-icons/fa", () => ({
  FaTimesCircle: () => <span data-testid="close-icon">×</span>
}));

describe('CaseDetailHeader Component', () => {
  const mockOnClose = jest.fn();

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly with title and close button', () => {
    render(<CaseDetailHeader onClose={mockOnClose} />);
    
    // Verify title text
    expect(screen.getByText('Detail Kasus Penyakit Menular')).toBeInTheDocument();
    
    // Verify close button exists
    expect(screen.getByTestId('close-icon')).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    render(<CaseDetailHeader onClose={mockOnClose} />);
    
    const closeButton = screen.getByTestId('close-icon').parentElement;
    fireEvent.click(closeButton!);
    
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('renders without error when onClose is not provided', () => {
    render(<CaseDetailHeader />);
    
    const closeButton = screen.getByTestId('close-icon').parentElement;
    
    // Should not throw when clicked without onClose handler
    expect(() => fireEvent.click(closeButton!)).not.toThrow();
  });

  it('has correct styling classes', () => {
    const { container } = render(<CaseDetailHeader onClose={mockOnClose} />);
    
    const headerDiv = container.firstChild;
    
    // Verify main container classes
    expect(headerDiv).toHaveClass('bg-blue-600');
    expect(headerDiv).toHaveClass('text-white');
    expect(headerDiv).toHaveClass('p-4');
    expect(headerDiv).toHaveClass('rounded-t-lg');
    expect(headerDiv).toHaveClass('flex');
    expect(headerDiv).toHaveClass('justify-between');
    expect(headerDiv).toHaveClass('items-center');
    
    // Verify close button hover class
    const closeButton = screen.getByTestId('close-icon').parentElement;
    expect(closeButton).toHaveClass('hover:text-gray-200');
  });

  it('has proper accessibility attributes', () => {
    render(<CaseDetailHeader onClose={mockOnClose} />);
    
    const closeButton = screen.getByTestId('close-icon').parentElement;
    expect(closeButton).toHaveAttribute('data-tooltip-close', 'true');
  });
});
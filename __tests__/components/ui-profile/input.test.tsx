import React from 'react';
import { render, screen } from '@testing-library/react';
import { Input } from '../../../app/components/ui-profile/input';

describe('Input Component', () => {
  it('renders input with default styling', () => {
    render(<Input placeholder="Enter text" />);
    const input = screen.getByPlaceholderText('Enter text');
    expect(input).toBeInTheDocument();
    expect(input).toHaveClass('rounded-md');
    expect(input).toHaveClass('border');
    expect(input).toHaveClass('border-gray-200');
  });

  it('applies custom className', () => {
    render(<Input className="custom-class" placeholder="Custom Input" />);
    const input = screen.getByPlaceholderText('Custom Input');
    expect(input).toHaveClass('custom-class');
  });

  it('passes input attributes correctly', () => {
    render(<Input type="password" name="password" required data-testid="password-input" />);
    const input = screen.getByTestId('password-input');
    expect(input).toHaveAttribute('type', 'password');
    expect(input).toHaveAttribute('name', 'password');
    expect(input).toHaveAttribute('required');
  });
});
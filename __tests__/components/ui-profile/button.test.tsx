import React from 'react';
import { render, screen } from '@testing-library/react';
import { Button } from '../../../app/components/ui-profile/button';

describe('Button Component', () => {
  it('renders button with default variant', () => {
    render(<Button>Click me</Button>);
    const button = screen.getByRole('button', { name: 'Click me' });
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass('bg-blue-500');
    expect(button).toHaveClass('text-white');
    expect(button).toHaveClass('hover:bg-blue-600');
  });

  it('renders button with destructive variant', () => {
    render(<Button variant="destructive">Destructive</Button>);
    const button = screen.getByRole('button', { name: 'Destructive' });
    expect(button).toBeInTheDocument();
    // Pastikan tidak memiliki class default
    expect(button).not.toHaveClass('bg-blue-500');
    expect(button).not.toHaveClass('text-white');
    expect(button).not.toHaveClass('hover:bg-blue-600');
  });

  it('renders button with outline variant', () => {
    render(<Button variant="outline">Outline</Button>);
    const button = screen.getByRole('button', { name: 'Outline' });
    expect(button).toBeInTheDocument();
    // Pastikan tidak memiliki class default
    expect(button).not.toHaveClass('bg-blue-500');
    expect(button).not.toHaveClass('text-white');
    expect(button).not.toHaveClass('hover:bg-blue-600');
  });

  it('applies custom className', () => {
    render(<Button className="custom-class">Custom Button</Button>);
    const button = screen.getByRole('button', { name: 'Custom Button' });
    expect(button).toHaveClass('custom-class');
  });

  it('forwards additional props to button element', () => {
    render(<Button type="submit" disabled data-testid="test-button">Submit</Button>);
    const button = screen.getByTestId('test-button');
    expect(button).toHaveAttribute('type', 'submit');
    expect(button).toBeDisabled();
  });

  it('forwards ref to button element', () => {
    const ref = jest.fn();
    render(<Button ref={ref}>Ref Button</Button>);
    expect(ref).toHaveBeenCalled();
  });
});
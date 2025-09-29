import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

import StatCard from '../../app/admin-dashboard/_components/StatCard';

describe('Admin Dashboard - StatCard', () => {
  it('renders with label and value', () => {
    render(<StatCard label="Total Users" value={100} />);
    
    expect(screen.getByText('Total Users')).toBeInTheDocument();
    expect(screen.getByText('100')).toBeInTheDocument();
  });

  it('renders with icon when provided', () => {
    render(
      <StatCard 
        label="Total Users" 
        value={100} 
        icon={<span data-testid="mock-icon">👥</span>}
      />
    );
    
    expect(screen.getByTestId('mock-icon')).toBeInTheDocument();
  });

  it('renders with hint when provided', () => {
    const hint = "Sample hint message";
    render(<StatCard label="Total Users" value={100} hint={hint} />);
    
    expect(screen.getByText(hint)).toBeInTheDocument();
  });

  it('does not render hint when not provided', () => {
    render(<StatCard label="Total Users" value={100} />);
    
    // No hint should be rendered
    const hintElement = screen.queryByText(/hint/i);
    expect(hintElement).not.toBeInTheDocument();
  });

  it('renders with string value', () => {
    render(<StatCard label="Status" value="Active" />);
    
    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
  });
});
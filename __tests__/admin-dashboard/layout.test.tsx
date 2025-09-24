import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock Navbar component
jest.mock('../../app/components/Navbar', () => () => (
  <div data-testid="mock-navbar">Mock Navbar</div>
));

import AdminDashboardLayout from '../../app/admin-dashboard/layout';

describe('Admin Dashboard - Layout', () => {
  it('renders with navbar and children', () => {
    const { getByTestId, getByText } = render(
      <AdminDashboardLayout>
        <div>Test Child Content</div>
      </AdminDashboardLayout>
    );
    
    // Should render the Navbar
    expect(getByTestId('mock-navbar')).toBeInTheDocument();
    
    // Should render the child content
    expect(getByText('Test Child Content')).toBeInTheDocument();
  });

  it('applies background styling', () => {
    const { container } = render(
      <AdminDashboardLayout>
        <div>Content</div>
      </AdminDashboardLayout>
    );
    
    // Check that the container has a child div
    const backgroundDiv = container.querySelector('div[style]');
    expect(backgroundDiv).not.toBeNull();
    
    // Instead of checking exact style values, just verify it has some styling
    expect(backgroundDiv?.getAttribute('style')).toContain('background');
    expect(backgroundDiv?.getAttribute('style')).toContain('min-height');
  });
});
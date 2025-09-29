import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

import RolePills from '../../app/admin-dashboard/_components/RolePills';

describe('Admin Dashboard - RolePills', () => {
  it('renders empty when no roles provided', () => {
    const { container } = render(<RolePills roles={[]} />);
    // Should render the container but no pill elements
    const pillsRow = container.querySelector('.pillsRow');
    expect(pillsRow).toBeInTheDocument();
    expect(pillsRow?.children.length).toBe(0);
  });

  it('renders single role', () => {
    const { container } = render(<RolePills roles={['Admin']} />);
    
    expect(screen.getByText('Admin')).toBeInTheDocument();
    const pillsRow = container.querySelector('.pillsRow');
    expect(pillsRow?.children.length).toBe(1);
  });

  it('renders multiple roles', () => {
    const roles = ['Admin', 'Expert', 'Kurator', 'Contributor'];
    const { container } = render(<RolePills roles={roles} />);
    
    roles.forEach(role => {
      expect(screen.getByText(role)).toBeInTheDocument();
    });
    
    // Container should have same number of children as roles
    const pillsRow = container.querySelector('.pillsRow');
    expect(pillsRow?.children.length).toBe(roles.length);
  });
});
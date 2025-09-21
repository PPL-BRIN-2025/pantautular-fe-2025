import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

import UserInfo from '../../app/admin-dashboard/_components/UserInfo';
import { AuthContext } from '../../app/auth/context';
import type { AuthStrategy } from '../../app/auth/strategies/base';

describe('Admin Dashboard - UserInfo', () => {
  const strategy: AuthStrategy = {
    login: async () => ({}),
    logout: async () => {},
    getUser: async () => ({}),
  };

  it('displays logged-in admin name and role', () => {
    const value = {
      login: async () => ({}),
      logout: async () => {},
      user: { id: 1, email: 'gojo@example.com', name: 'Gojo Satoru', role: 'Admin' },
      strategy,
    };

    render(
      <AuthContext.Provider value={value}>
        <UserInfo />
      </AuthContext.Provider>
    );

    expect(screen.getByText('Gojo Satoru | Admin')).toBeInTheDocument();
  });
});

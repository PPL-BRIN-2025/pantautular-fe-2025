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
    expect(screen.getByLabelText('Logged in admin information')).toBeInTheDocument();
  });

  it('displays default values when user is not defined', () => {
    const value = {
      login: async () => ({}),
      logout: async () => {},
      user: null,
      strategy,
    };

    render(
      <AuthContext.Provider value={value}>
        <UserInfo />
      </AuthContext.Provider>
    );

    expect(screen.getByText('Admin | —')).toBeInTheDocument();
  });

  it('displays default role when user has no role', () => {
    const value = {
      login: async () => ({}),
      logout: async () => {},
      user: { id: 2, email: 'user@example.com', name: 'Test User', role: null } as any,
      strategy,
    };

    render(
      <AuthContext.Provider value={value}>
        <UserInfo />
      </AuthContext.Provider>
    );

    expect(screen.getByText('Test User | —')).toBeInTheDocument();
  });
});

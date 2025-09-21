import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock cookies forwarding
jest.mock('next/headers', () => ({
  headers: () => Promise.resolve({ get: (k: string) => (k.toLowerCase() === 'cookie' ? 'sessionid=abc' : null) }),
}));

// Mock UserInfo to keep this test focused on stats
jest.mock('../../app/admin-dashboard/_components/UserInfo', () => () => (
  <div data-testid="user-info">Mock User Info</div>
));

import AdminDashboardPage from '../../app/admin-dashboard/page';

const ORIGINAL_ENV = { ...process.env };

describe('Admin Dashboard - Stats Binding', () => {
  beforeEach(() => {
    jest.resetModules();
    process.env = { ...ORIGINAL_ENV };
    (global.fetch as any) = jest.fn();
  });

  afterAll(() => {
    process.env = ORIGINAL_ENV;
  });

  it('binds numbers from backend (200 OK)', async () => {
    process.env.NEXT_PUBLIC_API_URL = 'http://api.local';
    process.env.NEXT_PUBLIC_API_KEY = 'key123';

    const payload = { totalUsers: 12, datasets: 5, failedLogins: 2, roles: ['Admin','Expert'] };
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, json: async () => payload });

    const ui = await AdminDashboardPage();
    render(ui as unknown as React.ReactElement);

    // Top stat cards
    expect(screen.getByText('Total Users')).toBeInTheDocument();
    expect(screen.getAllByText('5')[0]).toBeInTheDocument(); // datasets

    // Summary section values
    expect(screen.getAllByText('12')[0]).toBeInTheDocument(); // total users
    expect(screen.getAllByText('2')[0]).toBeInTheDocument();  // failed logins

    // Role count equals roles.length
    expect(screen.getAllByText('2')[0]).toBeInTheDocument();

    // UserInfo placeholder rendered
    expect(screen.getByTestId('user-info')).toBeInTheDocument();

    expect(global.fetch).toHaveBeenCalledWith('http://api.local/admin-feature/stats/', expect.objectContaining({
      cache: 'no-store',
      headers: expect.objectContaining({ 'x-api-key': 'key123' }),
      credentials: 'include',
    }));
  });

  it('shows fallbacks and logs error on 500', async () => {
    process.env.NEXT_PUBLIC_API_URL = 'http://api.local';
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({ ok: false, status: 500, text: async () => 'ISE' });

    const ui = await AdminDashboardPage();
    render(ui as unknown as React.ReactElement);
    expect(screen.getAllByText('0')[0]).toBeInTheDocument();

    expect(errorSpy).toHaveBeenCalled();
    const has500 = errorSpy.mock.calls.some(c => String(c[0]).includes('Admin stats HTTP error: 500'));
    expect(has500).toBe(true);
    errorSpy.mockRestore();
  });
});

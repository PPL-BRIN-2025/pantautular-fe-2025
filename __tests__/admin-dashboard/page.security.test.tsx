import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock cookies forwarding
jest.mock('next/headers', () => ({
  headers: () => Promise.resolve({ get: (k: string) => (k.toLowerCase() === 'cookie' ? 'sessionid=abc' : null) }),
}));

// Mock redirect from next/navigation
const redirectMock = jest.fn();
jest.mock('next/navigation', () => ({
  redirect: (...args: any[]) => redirectMock(...args),
}));

import AdminDashboardPage from '../../app/admin-dashboard/page';

const ORIGINAL_ENV = { ...process.env };

describe('Admin Dashboard - Security UX', () => {
  beforeEach(() => {
    jest.resetModules();
    process.env = { ...ORIGINAL_ENV };
    (global.fetch as any) = jest.fn();
    redirectMock.mockReset();
  });

  afterAll(() => {
    process.env = ORIGINAL_ENV;
  });

  it('renders access denied screen on 403 with friendly message', async () => {
    process.env.NEXT_PUBLIC_API_URL = 'http://api.local';
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 403,
      json: async () => ({ detail: 'Akses Ditolak' }),
    });

    const ui = await AdminDashboardPage();
    render(ui as unknown as React.ReactElement);

    expect(screen.getByText('Informasi Akses')).toBeInTheDocument();
    expect(screen.getByText('Akses Ditolak')).toBeInTheDocument();
    expect(redirectMock).not.toHaveBeenCalled();
  });

  it('redirects to login on 401 (unauthenticated)', async () => {
    process.env.NEXT_PUBLIC_API_URL = 'http://api.local';
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({ ok: false, status: 401 });

    let thrown: any = null;
    try {
      await AdminDashboardPage();
    } catch (e) {
      thrown = e;
    }

    expect(redirectMock).toHaveBeenCalledWith('/login?next=/admin-dashboard');
    // In Next.js, redirect throws to stop rendering; we simulate and accept any thrown error
    expect(thrown).toBeTruthy();
  });
});

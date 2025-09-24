import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock window location
Object.defineProperty(window, 'location', {
  value: {
    href: '',
  },
  writable: true,
});

// Mock cookies forwarding
jest.mock('next/headers', () => ({
  headers: () => Promise.resolve({ get: (k: string) => (k.toLowerCase() === 'cookie' ? 'sessionid=abc' : null) }),
}));

// Mock UserInfo to avoid AuthContext dependency
jest.mock('../../app/admin-dashboard/_components/UserInfo', () => () => (
  <div data-testid="user-info">Mock User Info</div>
));

import AdminDashboardPage from '../../app/admin-dashboard/page';

const ORIGINAL_ENV = { ...process.env };

describe('Admin Dashboard - Security UX', () => {
  beforeEach(() => {
    jest.resetModules();
    process.env = { ...ORIGINAL_ENV };
    (global.fetch as any) = jest.fn();
    window.location.href = '';
  });

  afterAll(() => {
    process.env = ORIGINAL_ENV;
  });

  it('renders access denied screen on 403 with friendly message', async () => {
    process.env.NEXT_PUBLIC_API_URL = 'http://api.local';
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 403,
      json: async () => ({ detail: 'Akses Ditolak' }),
    });

    render(<AdminDashboardPage />);

    // Wait for async state updates
    await waitFor(() => {
      expect(screen.getByText('Informasi Akses')).toBeInTheDocument();
    });
    
    expect(screen.getByText('Akses Ditolak')).toBeInTheDocument();
    
    // Links should be present
    const backLink = screen.getByRole('link', { name: 'Kembali' });
    expect(backLink).toBeInTheDocument();
    expect(backLink.getAttribute('href')).toBe('/');
    
    const loginLink = screen.getByRole('link', { name: 'Login' });
    expect(loginLink).toBeInTheDocument();
    expect(loginLink.getAttribute('href')).toBe('/login?next=/admin-dashboard');
  });

  it('handles 403 with invalid JSON response', async () => {
    process.env.NEXT_PUBLIC_API_URL = 'http://api.local';
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 403,
      json: async () => { throw new Error('Invalid JSON'); },
    });

    render(<AdminDashboardPage />);

    // Wait for async state updates
    await waitFor(() => {
      expect(screen.getByText('Akses Ditolak')).toBeInTheDocument();
    });
  });

  it('redirects to login on 401 (unauthenticated)', async () => {
    process.env.NEXT_PUBLIC_API_URL = 'http://api.local';
    (global.fetch as jest.Mock).mockResolvedValueOnce({ 
      ok: false, 
      status: 401 
    });

    render(<AdminDashboardPage />);
    
    // Wait for the redirect
    await waitFor(() => {
      expect(window.location.href).toBe('/login?next=%2Fadmin-dashboard');
    });
  });

  it('handles non-403 error status codes gracefully', async () => {
    process.env.NEXT_PUBLIC_API_URL = 'http://api.local';
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    // Test with 404 error
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 404,
      text: async () => 'Not Found',
    });

    render(<AdminDashboardPage />);

    // Wait for async updates
    await waitFor(() => {
      expect(errorSpy).toHaveBeenCalled();
    });
    
    // Should log error
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('Admin stats HTTP error: 404'));
    
    // Should render the page with default values
    const zeroValues = screen.getAllByText('0');
    expect(zeroValues.length).toBeGreaterThan(0);
    
    errorSpy.mockRestore();
  });
});

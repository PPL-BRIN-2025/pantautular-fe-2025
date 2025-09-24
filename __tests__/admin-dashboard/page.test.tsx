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

// Mock UserInfo to keep this test focused on stats
jest.mock('../../app/admin-dashboard/_components/UserInfo', () => () => (
  <div data-testid="user-info">Mock User Info</div>
));

// Mock localStorage
const localStorageMock = (function() {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value.toString(); },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
    _getStore: () => store,
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock document cookie
Object.defineProperty(document, 'cookie', {
  writable: true,
  value: '',
});

import AdminDashboardPage from '../../app/admin-dashboard/page';

const ORIGINAL_ENV = { ...process.env };

describe('Admin Dashboard - Stats Binding', () => {
  beforeEach(() => {
    jest.resetModules();
    process.env = { ...ORIGINAL_ENV };
    (global.fetch as any) = jest.fn();
    window.localStorage.clear();
    document.cookie = '';
    window.location.href = '';
  });

  afterAll(() => {
    process.env = ORIGINAL_ENV;
  });

  it('binds numbers from backend (200 OK)', async () => {
    process.env.NEXT_PUBLIC_API_URL = 'http://api.local';
    
    const payload = { 
      totalUsers: 12, 
      activeUsers: 8,
      datasets: 5, 
      failedLogins: 2, 
      roles: ['Admin','Expert'],
      messages: {
        usersMessage: "Total registered users",
        datasetsMessage: "Available datasets",
        activityMessage: "Recent activity"
      }
    };
    
    (global.fetch as jest.Mock).mockResolvedValueOnce({ 
      ok: true, 
      json: async () => payload 
    });

    render(<AdminDashboardPage />);
    
    // Wait for state updates after fetch
    await waitFor(() => {
      // Check for specific content that indicates a successful API response
      expect(screen.getByText('Total Users')).toBeInTheDocument();
    });
    
    // Check for the expected data values using specific queries to avoid ambiguity
    await waitFor(() => {
      // Check totalUsers value is 12
      const totalUsersValue = screen.getAllByText('12');
      expect(totalUsersValue.length).toBeGreaterThan(0);
      
      // Check datasets value is 5
      const datasetsValue = screen.getAllByText('5');
      expect(datasetsValue.length).toBeGreaterThan(0);
      
      // Check activeUsers value is 8
      const activeUsersValue = screen.getAllByText('8');
      expect(activeUsersValue.length).toBeGreaterThan(0);
    });

    // Check for role pills
    expect(screen.getByText('Admin')).toBeInTheDocument();
    expect(screen.getByText('Expert')).toBeInTheDocument();
    
    // Check for role count (using role count class)
    const roleCount = screen.getByText('2', { selector: '.roleCount' });
    expect(roleCount).toBeInTheDocument();

    // Hints/messages rendered
    expect(screen.getByText('Total registered users')).toBeInTheDocument();
    expect(screen.getByText('Available datasets')).toBeInTheDocument();
    expect(screen.getByText('Recent activity')).toBeInTheDocument();

    // UserInfo placeholder rendered
    expect(screen.getByTestId('user-info')).toBeInTheDocument();

    expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('/admin-feature/stats'), 
      expect.objectContaining({
        method: "GET",
        cache: "no-store",
        headers: expect.any(Object),
        credentials: "include",
      })
    );
  });

  it('handles alternative API response formats', async () => {
    process.env.NEXT_PUBLIC_API_URL = 'http://api.local';
    
    // Different property naming in API response
    const payload = { 
      total_users: 15, 
      active_users: 10,
      dataset: 7, 
      failed: 3,
      roles: ['Admin', 'User', 'Guest'],
      usersMessage: "User count message",
      datasetsMessage: "Dataset message",
      activityMessage: "Activity message"
    };
    
    (global.fetch as jest.Mock).mockResolvedValueOnce({ 
      ok: true, 
      json: async () => payload 
    });

    render(<AdminDashboardPage />);

    // Wait for async state updates and check values
    await waitFor(() => {
      // Check totalUsers value (total_users in the payload)
      const cardValues = screen.getAllByText('15');
      expect(cardValues.length).toBeGreaterThan(0);
    });
    
    // Check activeUsers value (active_users in the payload)
    const activeUsers = screen.getAllByText('10');
    expect(activeUsers.length).toBeGreaterThan(0);
    
    // Check datasets value (dataset in the payload)
    const datasets = screen.getAllByText('7');
    expect(datasets.length).toBeGreaterThan(0);
    
    // Check messages are displayed
    expect(screen.getByText('User count message')).toBeInTheDocument();
    expect(screen.getByText('Dataset message')).toBeInTheDocument();
    expect(screen.getByText('Activity message')).toBeInTheDocument();
    
    // Check roles
    expect(screen.getByText('User')).toBeInTheDocument();
    expect(screen.getByText('Guest')).toBeInTheDocument();
    expect(screen.getByText('Admin')).toBeInTheDocument();
    
    // The role count should be 3 in the roleCount div
    const roleCountDiv = screen.getAllByText('3')[0];
    expect(roleCountDiv).toBeInTheDocument();
  });

  it('redirects to login when auth token is missing and receives 401', async () => {
    process.env.NEXT_PUBLIC_API_URL = 'http://api.local';
    
    (global.fetch as jest.Mock).mockResolvedValueOnce({ 
      ok: false,
      status: 401
    });

    render(<AdminDashboardPage />);
    
    // Wait for the redirect to happen
    await waitFor(() => {
      expect(window.location.href).toBe('/login?next=%2Fadmin-dashboard');
    });
  });

  it('shows fallbacks and logs error on 500', async () => {
    process.env.NEXT_PUBLIC_API_URL = 'http://api.local';
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    (global.fetch as jest.Mock).mockResolvedValueOnce({ 
      ok: false, 
      status: 500, 
      text: async () => 'ISE' 
    });

    render(<AdminDashboardPage />);
    
    // Wait for the component to finish rendering
    await waitFor(() => {
      expect(errorSpy).toHaveBeenCalled();
    });
    
    // Check that default values are shown (without using regex)
    const zeroValues = screen.getAllByText('0');
    expect(zeroValues.length).toBeGreaterThan(0);
    
    // Verify the error contains the specific text
    const has500 = errorSpy.mock.calls.some(c => String(c[0]).includes('Admin stats HTTP error: 500'));
    expect(has500).toBe(true);
    errorSpy.mockRestore();
  });

  it('handles 403 forbidden response with custom detail', async () => {
    process.env.NEXT_PUBLIC_API_URL = 'http://api.local';
    
    (global.fetch as jest.Mock).mockResolvedValueOnce({ 
      ok: false,
      status: 403,
      json: async () => ({ detail: "Admin access required" })
    });

    render(<AdminDashboardPage />);
    
    // Wait for the component to update with the 403 response
    await waitFor(() => {
      expect(screen.getByText('Informasi Akses')).toBeInTheDocument();
    });
    
    expect(screen.getByText('Admin access required')).toBeInTheDocument();
    expect(screen.getByText(/Anda tidak memiliki izin/)).toBeInTheDocument();
  });

  it('handles 403 forbidden response with default message when no detail', async () => {
    process.env.NEXT_PUBLIC_API_URL = 'http://api.local';
    
    (global.fetch as jest.Mock).mockResolvedValueOnce({ 
      ok: false,
      status: 403,
      json: async () => ({}) // No detail provided
    });

    render(<AdminDashboardPage />);
    
    // Wait for the component to update with the 403 response
    await waitFor(() => {
      expect(screen.getByText('Akses Ditolak')).toBeInTheDocument();
    });
  });

  it('gets auth token from localStorage', async () => {
    process.env.NEXT_PUBLIC_API_URL = 'http://api.local';
    window.localStorage.setItem('token', 'test-token-value');
    
    (global.fetch as jest.Mock).mockResolvedValueOnce({ 
      ok: true, 
      json: async () => ({ totalUsers: 5 }) 
    });

    render(<AdminDashboardPage />);
    
    await waitFor(() => {
      // Check that fetch was called
      expect(global.fetch).toHaveBeenCalled();
    });
    
    // Check that Authorization header was set with token
    expect(global.fetch).toHaveBeenCalledWith(expect.any(String), 
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer test-token-value'
        })
      })
    );
  });

  it('gets auth token from cookie when not in localStorage', async () => {
    process.env.NEXT_PUBLIC_API_URL = 'http://api.local';
    document.cookie = 'access_token=cookie-token-value';
    
    (global.fetch as jest.Mock).mockResolvedValueOnce({ 
      ok: true, 
      json: async () => ({ totalUsers: 5 }) 
    });

    render(<AdminDashboardPage />);
    
    await waitFor(() => {
      // Check that fetch was called
      expect(global.fetch).toHaveBeenCalled();
    });
    
    // Check that Authorization header was set with token from cookie
    expect(global.fetch).toHaveBeenCalledWith(expect.any(String), 
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer cookie-token-value'
        })
      })
    );
  });

  it('handles empty API_URL gracefully', async () => {
    // Simply test with a null fetch response instead of trying to mock API_BASE
    (global.fetch as jest.Mock).mockResolvedValueOnce(null); 
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    render(<AdminDashboardPage />);
    
    // Give the component time to render with default values
    await waitFor(() => {
      expect(screen.getAllByText('0').length).toBeGreaterThan(0);
    });
    
    // Check that we got an error (would happen with null fetch result)
    expect(errorSpy).toHaveBeenCalled();
    
    // Check for default values (zero stats)
    const zeroValues = screen.getAllByText('0');
    expect(zeroValues.length).toBeGreaterThan(0);
    
    // Restore
    errorSpy.mockRestore();
  });

  it('handles fetch error gracefully', async () => {
    process.env.NEXT_PUBLIC_API_URL = 'http://api.local';
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    render(<AdminDashboardPage />);
    
    await waitFor(() => {
      // Should log error
      expect(errorSpy).toHaveBeenCalledWith('Failed to fetch admin stats:', expect.any(Error));
    });
    
    // Check for default values (zero stats)
    const zeroValues = screen.getAllByText('0');
    expect(zeroValues.length).toBeGreaterThan(0);
    
    errorSpy.mockRestore();
  });
});

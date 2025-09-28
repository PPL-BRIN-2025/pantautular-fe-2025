import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

const renderPage = async () => {
  const { default: AdminDashboardPage } = await import('../../app/admin-dashboard/page');
  return render(<AdminDashboardPage />);
};

const assertAuthorizationHeader = async (token: string) => {
  await waitFor(() => {
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: `Bearer ${token}`,
        }),
      })
    );
  });
};

// Mock window location
Object.defineProperty(window, 'location', {
  value: {
    href: '',
  },
  writable: true,
});

// Mock cookies forwarding
jest.mock('next/headers', () => ({
  headers: () => Promise.resolve({
    get: (k: string) => (k.toLowerCase() === 'cookie' ? 'sessionid=abc' : null),
  }),
}));

// Mock UserInfo to keep this test focused on stats
jest.mock('../../app/admin-dashboard/_components/UserInfo', () => () => (
  <div data-testid="user-info">Mock User Info</div>
));

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock document cookie
Object.defineProperty(document, 'cookie', {
  writable: true,
  value: '',
});

const ORIGINAL_ENV = { ...process.env };

describe('Admin Dashboard - Stats Binding', () => {
  beforeEach(() => {
    process.env = { ...ORIGINAL_ENV };
    process.env.NEXT_PUBLIC_API_URL = 'http://api.local';
  (globalThis.fetch as any) = jest.fn();
    window.localStorage.clear();
    document.cookie = '';
    window.location.href = '';
    jest.clearAllMocks();
  });

  afterAll(() => {
    process.env = ORIGINAL_ENV;
  });

  it('binds numbers from backend (200 OK)', async () => {
    const payload = {
      totalUsers: 12,
      activeUsers: 8,
      datasets: 5,
      failedLogins: 2,
      roles: ['Admin', 'Expert'],
      messages: {
        usersMessage: 'Total registered users',
        datasetsMessage: 'Available datasets',
        activityMessage: 'Recent activity',
      },
    };

  (globalThis.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => payload,
    });

    await renderPage();

    await waitFor(() => {
      expect(screen.getByText('Jumlah Pengguna')).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getAllByText('12').length).toBeGreaterThan(0);
      expect(screen.getAllByText('5').length).toBeGreaterThan(0);
      expect(screen.getAllByText('8').length).toBeGreaterThan(0);
    });

    expect(screen.getByText('Admin')).toBeInTheDocument();
    expect(screen.getByText('Expert')).toBeInTheDocument();

    const roleCount = screen.getByText('2', { selector: '.roleCount' });
    expect(roleCount).toBeInTheDocument();

    expect(screen.getByText('Total registered users')).toBeInTheDocument();
    expect(screen.getByText('Available datasets')).toBeInTheDocument();
    expect(screen.getByText('Recent activity')).toBeInTheDocument();

    expect(screen.getByTestId('user-info')).toBeInTheDocument();

    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/admin-feature/stats'),
      expect.objectContaining({
        method: 'GET',
        cache: 'no-store',
        headers: expect.any(Object),
        credentials: 'include',
      })
    );
  });

  it('falls back to default API_BASE when NEXT_PUBLIC_API_URL is undefined', async () => {
    delete process.env.NEXT_PUBLIC_API_URL;
    let apiBase: string | undefined;

    await jest.isolateModulesAsync(async () => {
      const mod = await import('../../config');
      apiBase = mod.API_BASE;
    });

    expect(apiBase).toBe('http://localhost:8000');
  });

  it('handles alternative API response formats', async () => {
    const payload = {
      total_users: 15,
      active_users: 10,
      dataset: 7,
      failed: 3,
      roles: ['Admin', 'User', 'Guest'],
      usersMessage: 'User count message',
      datasetsMessage: 'Dataset message',
      activityMessage: 'Activity message',
    };

  (globalThis.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => payload,
    });

    await renderPage();

    await waitFor(() => {
      expect(screen.getAllByText('15').length).toBeGreaterThan(0);
    });

    expect(screen.getAllByText('10').length).toBeGreaterThan(0);
    expect(screen.getAllByText('7').length).toBeGreaterThan(0);

    expect(screen.getByText('User count message')).toBeInTheDocument();
    expect(screen.getByText('Dataset message')).toBeInTheDocument();
    expect(screen.getByText('Activity message')).toBeInTheDocument();

    expect(screen.getByText('User')).toBeInTheDocument();
    expect(screen.getByText('Guest')).toBeInTheDocument();
    expect(screen.getByText('Admin')).toBeInTheDocument();

    const roleCountDiv = screen.getAllByText('3')[0];
    expect(roleCountDiv).toBeInTheDocument();
  });

  it('redirects to login when auth token is missing and receives 401', async () => {
  (globalThis.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 401,
    });

    await renderPage();

    await waitFor(() => {
      expect(window.location.href).toBe('/login?next=%2Fadmin-dashboard');
    });
  });

  it('shows fallbacks and logs error on 500', async () => {
  const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  (globalThis.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 500,
      text: async () => 'ISE',
    });

    await renderPage();

    await waitFor(() => {
      expect(errorSpy).toHaveBeenCalled();
    });

    expect(screen.getAllByText('0').length).toBeGreaterThan(0);

    const has500 = errorSpy.mock.calls.some((c) => String(c[0]).includes('Admin stats HTTP error: 500'));
    expect(has500).toBe(true);
    errorSpy.mockRestore();
  });

  it('handles 403 forbidden response with custom detail', async () => {
    (globalThis.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 403,
      json: async () => ({ detail: 'Admin access required' }),
    });

    await renderPage();

    await waitFor(() => {
      expect(screen.getByText('Informasi Akses')).toBeInTheDocument();
    });

    expect(screen.getByText('Admin access required')).toBeInTheDocument();
    expect(screen.getByText(/Anda tidak memiliki izin/)).toBeInTheDocument();
  });

  it('handles 403 forbidden response with default message when no detail', async () => {
  (globalThis.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 403,
      json: async () => ({}),
    });

    await renderPage();

    await waitFor(() => {
      expect(screen.getByText('Akses Ditolak')).toBeInTheDocument();
    });
  });

  it('handles 403 forbidden response when parsing detail fails', async () => {
  (globalThis.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 403,
      json: async () => {
        throw new Error('bad json');
      },
    });

    await renderPage();

    await waitFor(() => {
      expect(screen.getByText('Akses Ditolak')).toBeInTheDocument();
    });
  });

  it('gets auth token from localStorage', async () => {
    window.localStorage.setItem('token', 'test-token-value');

  (globalThis.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ totalUsers: 5 }),
    });

    await renderPage();
    await assertAuthorizationHeader('test-token-value');
  });

  it('gets auth token from cookie when not in localStorage', async () => {
    document.cookie = 'access_token=cookie-token-value';

  (globalThis.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ totalUsers: 5 }),
    });

    await renderPage();
    await assertAuthorizationHeader('cookie-token-value');
  });

  it('handles empty API_URL gracefully', async () => {
  (globalThis.fetch as jest.Mock).mockResolvedValueOnce(null);
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    await renderPage();

    await waitFor(() => {
      expect(screen.getAllByText('0').length).toBeGreaterThan(0);
    });

    expect(errorSpy).toHaveBeenCalled();

    errorSpy.mockRestore();
  });

  it('handles fetch error gracefully', async () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  (globalThis.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    await renderPage();

    await waitFor(() => {
      expect(errorSpy).toHaveBeenCalledWith('Failed to fetch admin stats:', expect.any(Error));
    });

    expect(screen.getAllByText('0').length).toBeGreaterThan(0);

    errorSpy.mockRestore();
  });

  it('logs a warning and stops loading when API_BASE is not set', async () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    await jest.isolateModulesAsync(async () => {
      jest.doMock('../../config', () => ({
        API_BASE: '',
      }));

      const { render: isolatedRender, waitFor: isolatedWaitFor } = await import('@testing-library/react/pure');
      const { default: AdminDashboardPage } = await import('../../app/admin-dashboard/page');

      isolatedRender(<AdminDashboardPage />);

      await isolatedWaitFor(() => {
        expect(warnSpy).toHaveBeenCalledWith(
          'NEXT_PUBLIC_API_URL is not set. Using demo defaults for stats.'
        );
        expect(globalThis.fetch).not.toHaveBeenCalled();
      });
    });

    warnSpy.mockRestore();
  });

  it('keeps default roles when API response has no roles array', async () => {
    (globalThis.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        totalUsers: 3,
        activeUsers: 2,
        datasets: 1,
        failedLogins: 0,
        messages: {},
      }),
    });

    await renderPage();

    await waitFor(() => {
      expect(screen.getByText('Jumlah Pengguna')).toBeInTheDocument();
    });

    const rolePills = screen.getAllByText('Kontributor');
    expect(rolePills.length).toBeGreaterThan(0);
  });

  it('uses nested message keys when top-level message fields are missing', async () => {
    (globalThis.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        totalUsers: 9,
        activeUsers: 4,
        datasets: 2,
        failedLogins: 1,
        messages: {
          users: 'Users fallback',
          datasets: 'Datasets fallback',
          activity: 'Activity fallback',
        },
      }),
    });

    await renderPage();

    await waitFor(() => {
      expect(screen.getByText('Users fallback')).toBeInTheDocument();
      expect(screen.getByText('Datasets fallback')).toBeInTheDocument();
      expect(screen.getByText('Activity fallback')).toBeInTheDocument();
    });
  });

  it('returns null token when window is undefined (server-side guard)', async () => {
    const windowDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'window');

    Object.defineProperty(globalThis, 'window', {
      configurable: true,
      writable: true,
      value: undefined,
    });

    const { __testables } = await import('../../app/admin-dashboard/page');
    expect(__testables.getToken()).toBeNull();

    if (windowDescriptor) {
      Object.defineProperty(globalThis, 'window', windowDescriptor);
    }
  });

  it('handles response without messages payload', async () => {
    (globalThis.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        totalUsers: 2,
        activeUsers: 1,
        datasets: 0,
        failedLogins: 0,
      }),
    });

    await renderPage();

    await waitFor(() => {
      expect(screen.getAllByText('2').length).toBeGreaterThan(0);
    });

    expect(screen.queryByText('Users fallback')).not.toBeInTheDocument();
  });

  it('handles null messages payload gracefully', async () => {
    (globalThis.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        totalUsers: 4,
        activeUsers: 2,
        datasets: 1,
        failedLogins: 0,
        messages: null,
      }),
    });

    await renderPage();

    await waitFor(() => {
      expect(screen.getAllByText('4').length).toBeGreaterThan(0);
    });
  });

  it('pickMessage helper returns first available message', async () => {
    const { __testables } = await import('../../app/admin-dashboard/page');

    expect(__testables.pickMessage('primary', 'secondary', 'tertiary')).toBe('primary');
    expect(__testables.pickMessage(undefined, 'secondary', 'tertiary')).toBe('secondary');
    expect(__testables.pickMessage(undefined, undefined, 'tertiary')).toBe('tertiary');
    expect(__testables.pickMessage()).toBeUndefined();
  });
});

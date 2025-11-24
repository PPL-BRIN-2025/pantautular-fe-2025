import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

// Use the same next/navigation test mock pattern used elsewhere in the suite to
// keep behavior consistent with other tests (router push/replace update global.location.href)
jest.mock('next/navigation', () => {
  const push = jest.fn((url: string) => {
    try { (global as any).location.href = url; } catch (e) { /* ignore */ }
    return Promise.resolve();
  });
  const replace = jest.fn((url: string) => {
    try { (global as any).location.href = url; } catch (e) { /* ignore */ }
    return Promise.resolve();
  });
  return {
    __esModule: true,
    useRouter: () => ({ push, replace, back: jest.fn(() => { try { (global as any).location.href = (global as any).location?.pathname || ''; } catch (e) {} }), prefetch: jest.fn() }),
    useSearchParams: () => {
      const raw = (global as any).location?.search || '';
      const params = new URLSearchParams(raw.replace(/^\?/, ''));
      return { get: (k: string) => params.get(k), toString: () => raw.replace(/^\?/, ''), entries: () => params.entries() };
    },
    usePathname: () => (global as any).location?.pathname || '',
    useParams: () => {
      const raw = (global as any).location?.search || '';
      return Object.fromEntries(new URLSearchParams(raw.replace(/^\?/, '')));
    },
    // expose the spies so tests can assert on them
    _mock: { push, replace },
  };
});

const mockUseAuth = jest.fn();
jest.mock('../../app/auth/hooks/useAuth', () => ({ useAuth: () => mockUseAuth() }));

// Mock Navbar/Footer/AccessDenied components (simple placeholders)
jest.mock(require.resolve('../../app/components/Navbar'), () => ({ __esModule: true, default: () => <div data-testid="mock-navbar">NAV</div> }));
jest.mock(require.resolve('../../app/components/Footer'), () => ({ __esModule: true, default: () => <div data-testid="mock-footer">FOOTER</div> }));
jest.mock(require.resolve('../../app/components/AccessDenied'), () => ({ __esModule: true, default: () => <div data-testid="mock-access-denied">ACCESS_DENIED</div> }));

// Mock CsvUpload to expose buttons that call the success/error callbacks so tests
// can simulate upload result flows without parsing CSV files.
jest.mock(require.resolve('../../app/components/CsvUpload'), () => ({
  __esModule: true,
  default: ({ onSuccessAction, onErrorAction }: any) => (
    <div>
      <button onClick={() => onSuccessAction && onSuccessAction('Uploaded!')}>MOCK_UPLOAD_SUCCESS</button>
      <button onClick={() => onErrorAction && onErrorAction('Failed')}>MOCK_UPLOAD_ERROR</button>
    </div>
  ),
}));

describe('CuratorBulkUploadPage (expert-bulk-upload)', () => {
  beforeEach(() => {
    // keep mock state clean between tests
    mockUseAuth.mockReset();
  });

  test('redirects unauthenticated users to login', async () => {
    mockUseAuth.mockReturnValue({ user: null });

    // Prevent jsdom from throwing when code sets window.location.href by
    // replacing the global location with a simple object that captures assigns.
    const originalLocation = (global as any).location;
    // @ts-ignore
    delete (global as any).location;
    (global as any).location = { href: '', search: '', pathname: '/', assign(url: string) { this.href = url; }, replace(url: string) { this.href = url; } };

  const nav = require('next/navigation');
  const navExports = nav && nav._mock ? nav : (nav && (nav as any).default) ? (nav as any).default : nav;
    const Page = require('../../app/expert-bulk-upload/page').default;
    render(<Page />);

    // the mocked router replacement should be called when not authenticated
  await waitFor(() => expect(navExports._mock.replace).toHaveBeenCalled());
  expect(navExports._mock.replace.mock.calls[0][0]).toMatch(/login/);

  // restore original location
  // @ts-ignore
  (global as any).location = originalLocation;
  });

  test('shows access denied for authenticated non-EXP_USER', async () => {
    mockUseAuth.mockReturnValue({ user: { role: 'USER' } });

    const Page = require('../../app/expert-bulk-upload/page').default;
    render(<Page />);

    // The AccessDenied placeholder should appear (we mocked it)
    expect(await screen.findByTestId('mock-access-denied')).toBeInTheDocument();
    // Navbar and Footer should also be rendered
    expect(screen.getByTestId('mock-navbar')).toBeInTheDocument();
    expect(screen.getByTestId('mock-footer')).toBeInTheDocument();
  });

  test('renders upload UI for EXP_USER and shows feedback on success then can close it', async () => {
    mockUseAuth.mockReturnValue({ user: { role: 'EXP_USER' } });

    const Page = require('../../app/expert-bulk-upload/page').default;
    render(<Page />);

    // heading should be present
    expect(await screen.findByText(/Unggah CSV \(Bulk\)/i)).toBeInTheDocument();

    // template download link should be present and point to the expected path
    const link = screen.getByRole('link', { name: /Download contoh template CSV/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/templates/example_cases.csv');

    // trigger mock upload success
    const successBtn = screen.getByText('MOCK_UPLOAD_SUCCESS');
    fireEvent.click(successBtn);

    // feedback should appear with the message from the mock
    const status = await screen.findByRole('status');
    expect(status).toHaveTextContent('Uploaded!');

    // close the feedback using the close button (aria-label)
    const closeBtn = screen.getByLabelText('Tutup pesan');
    fireEvent.click(closeBtn);

    await waitFor(() => expect(screen.queryByRole('status')).toBeNull());
  });
});

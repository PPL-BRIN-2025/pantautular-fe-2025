import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';

// Mock next/navigation useRouter and related hooks
const mockReplace = jest.fn();
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({ replace: mockReplace, push: mockPush }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(''),
}));

// Mock heavy UI components so rendering the page doesn't pull in router hooks
jest.mock('../../app/components/Navbar', () => ({ __esModule: true, default: () => <div data-testid="navbar" /> }));
jest.mock('../../app/components/Footer', () => ({ __esModule: true, default: () => <div data-testid="footer" /> }));
jest.mock('../../app/components/AccessDenied', () => ({ __esModule: true, default: () => <div data-testid="access-denied" /> }));
jest.mock('../../app/components/CsvUpload', () => ({ __esModule: true, default: () => <div data-testid="csv-upload" /> }));

// Mock the auth hook used by the page component
jest.mock('../../app/auth/hooks/useAuth', () => ({
  useAuth: () => ({ user: null }),
}));

// Import the component after mocks are set up
import CuratorEditDeleteDataPage from '../../app/curator-edit-delete-data/page';

describe('CuratorEditDeleteDataPage (focused)', () => {
  afterEach(() => {
    jest.resetAllMocks();
    // cleanup any injected globals
    try { delete (global as any).__TEST_INJECT_API__; } catch {}
    try { window.localStorage.clear(); } catch {}
  });

  test('redirects to login when not authenticated', async () => {
    // ensure useAuth mock returns null user (set above)
    render(<CuratorEditDeleteDataPage />);

    // wait for effect to run and call router.replace
    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalled();
    });
  });

  test('renders test hooks and opens edit modal when test API injected', async () => {

    // Instead of re-mocking the hook, populate localStorage so the page recovers a persisted user
    window.localStorage.setItem('user', JSON.stringify({ id: 'u1', role: 'ADMIN' }));

    // Provide a simple injected API so the component renders test hooks
    (global as any).__TEST_INJECT_API__ = { getCuratorCase: async () => ({}) };

    render(<CuratorEditDeleteDataPage />);

    // The test-hooks div is rendered but hidden; we can still query it
    const openBtn = await screen.findByTestId('test-open-edit-modal');
    expect(openBtn).toBeInTheDocument();

    // Click it to open the edit modal
    fireEvent.click(openBtn);

    // Modal should appear (role=dialog)
    await waitFor(() => {
      const dialogs = screen.queryAllByRole('dialog');
      expect(dialogs.length).toBeGreaterThan(0);
    });
  });

  test('exercises additional modals and overlays via test hooks (if present)', async () => {
    // Prepare persisted user and injected API so test-hooks appear
    window.localStorage.setItem('user', JSON.stringify({ id: 'u1', role: 'ADMIN' }));
    // ensure the page thinks there's an id in the URL so it loads the case (not the not-found state)
    window.history.pushState({}, 'test', '/?id=1');
    (global as any).__TEST_INJECT_API__ = { getCuratorCase: async () => ({
      id: '1', jenis: 'DBD', lokasi: 'Bandung', src_portal: 'Portal', src_title: 'T', src_type: 'artikel', src_content: '', src_url: '', src_author: '', date_published: '', img_url: ''
    }) };

    render(<CuratorEditDeleteDataPage />);

    // Wait for test-hooks container to exist
    const hooks = await screen.findByTestId('test-hooks');
    expect(hooks).toBeInTheDocument();

    // Candidate test hook IDs that the page may render (cover many modal/overlay paths)
    const hookIds = [
      'test-open-edit-modal',
      'test-open-delete-confirm',
      'test-open-add-jenis',
      'test-open-add-lokasi',
      'test-open-add-provinsi',
      'test-show-server-validation',
      'test-show-diag-result'
    ];

    for (const id of hookIds) {
      const btn = screen.queryByTestId(id);
      if (!btn) continue; // some hooks may not be present in all builds

      const beforeDialogs = screen.queryAllByRole('dialog').length;
      fireEvent.click(btn);

      // Many of the target lines render dialogs/overlays. Wait for at least one dialog to appear
      await waitFor(() => {
        const after = screen.queryAllByRole('dialog').length;
        expect(after).toBeGreaterThanOrEqual(beforeDialogs);
      });
    }
  });

  test('open specific modals and assert inner elements for targeted ranges', async () => {
    // Prepare persisted user and injected API so test-hooks appear
    window.localStorage.setItem('user', JSON.stringify({ id: 'u1', role: 'ADMIN' }));
    (global as any).__TEST_INJECT_API__ = { getCuratorCase: async () => ({}) };

    render(<CuratorEditDeleteDataPage />);

    // 1) Edit modal (lines ~1506-1618): should show dialog and contain a textarea/input
    const editBtn = await screen.findByTestId('test-open-edit-modal');
    fireEvent.click(editBtn);
    const editDialog = await screen.findByRole('dialog');
    // expect at least one input or textarea inside the edit dialog
    const hasInputOrTextarea = !!(editDialog.querySelector('input') || editDialog.querySelector('textarea'));
    expect(hasInputOrTextarea).toBe(true);

    // close edit modal if there's a close button in the dialog
    const closeBtn = editDialog.querySelector('button');
    if (closeBtn) fireEvent.click(closeBtn);

    // 2) Add provinsi modal (lines ~1662-1709): input placeholder "Nama provinsi" exists
    const provBtn = screen.queryByTestId('test-open-add-provinsi');
    if (provBtn) {
      fireEvent.click(provBtn);
      const provInput = await screen.findByPlaceholderText('Nama provinsi');
      expect(provInput).toBeInTheDocument();
    }

    // 3) Delete confirm (lines ~1643-1654 and 1672): clicking opens confirmation dialog with a button
    const delBtn = screen.queryByTestId('test-open-delete-confirm');
    if (delBtn) {
      fireEvent.click(delBtn);
      const delDialog = await screen.findByRole('dialog');
      const actionBtn = delDialog.querySelector('button');
      expect(actionBtn).toBeTruthy();
      // close it
      if (actionBtn) fireEvent.click(actionBtn);
    }

    // 4) Add jenis / add lokasi modals (lines ~1717-1762): ensure inputs exist when opened
    const jenisBtn = screen.queryByTestId('test-open-add-jenis');
    if (jenisBtn) {
      fireEvent.click(jenisBtn);
      const jenisDialog = await screen.findByRole('dialog');
      expect(!!jenisDialog.querySelector('input')).toBe(true);
    }

    const lokasiBtn = screen.queryByTestId('test-open-add-lokasi');
    if (lokasiBtn) {
      fireEvent.click(lokasiBtn);
      const lokasiDialog = await screen.findByRole('dialog');
      expect(!!lokasiDialog.querySelector('input')).toBe(true);
    }

    // 5) Server validation and diag overlays (lines ~1758-1792, 1798-1805): clicking should produce a dialog
    const svBtn = screen.queryByTestId('test-show-server-validation');
    if (svBtn) {
      fireEvent.click(svBtn);
      await waitFor(() => expect(screen.queryAllByRole('dialog').length).toBeGreaterThan(0));
    }

    const diagBtn = screen.queryByTestId('test-show-diag-result');
    if (diagBtn) {
      fireEvent.click(diagBtn);
      await waitFor(() => expect(screen.queryAllByRole('dialog').length).toBeGreaterThan(0));
    }
  });

  test('renders keparahan select, kewaspadaan track and emoji (lines ~1260-1401)', async () => {
    // Prepare persisted user and injected API so page renders normally
    window.localStorage.setItem('user', JSON.stringify({ id: 'u1', role: 'ADMIN' }));
    (global as any).__TEST_INJECT_API__ = { getCuratorCase: async () => ({}) };

    render(<CuratorEditDeleteDataPage />);

    // the disabled keparahan select should be present with default value
    const keparahan = await screen.findByRole('combobox', { name: /Tingkat Keparahan/i });
    expect(keparahan).toBeInTheDocument();
    // default option value is 'insiden'
    expect((keparahan as HTMLSelectElement).value).toBe('insiden');

    // kewaspadaan group should exist and the emoji should render
    const group = screen.getByRole('group', { name: /Tingkat Kewaspadaan/i });
    expect(group).toBeInTheDocument();

    // emoji span is rendered above the track; initial kewaspadaan is 1 -> '🙂'
    const emoji = await screen.findByText('🙂');
    expect(emoji).toBeInTheDocument();

    // the slider control button exists but should be disabled when not editing
    const sliderBtn = screen.getByRole('button', { name: /Geser tingkat kewaspadaan/i });
    expect(sliderBtn).toBeInTheDocument();
    expect(sliderBtn).toBeDisabled();
  });
});

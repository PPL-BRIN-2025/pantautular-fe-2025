import React from 'react';
import { render, screen, waitFor, fireEvent, within } from '@testing-library/react';

jest.mock('../../app/components/Navbar', () => () => <div data-testid="mock-navbar">Navbar</div>);
jest.mock('../../app/components/Footer', () => () => <div data-testid="mock-footer">Footer</div>);
jest.mock('../../app/components/AccessDenied', () => () => <div data-testid="access-denied">AccessDenied</div>);

const mockUseAuth = jest.fn(() => ({ user: { role: 'CURATOR' } }));
jest.mock('../../app/auth/hooks/useAuth', () => ({
  useAuth: () => mockUseAuth(),
}));

const mockListPending = jest.fn();
const mockReview = jest.fn();

jest.mock('../../api/contributorEvents', () => ({
  listPendingContributorEvents: (...args: any[]) => mockListPending(...args),
  reviewContributorEvent: (...args: any[]) => mockReview(...args),
  HttpError: class HttpError extends Error {},
}));

import CuratorDataPendingPage from '../../app/curator-data-pending/page';

beforeEach(() => {
  mockUseAuth.mockReset();
  mockUseAuth.mockReturnValue({ user: { role: 'CURATOR' } });
  mockListPending.mockReset();
  mockReview.mockReset();
});

test('shows access denied for non-approver roles', () => {
  mockUseAuth.mockReturnValueOnce({ user: { role: 'CONTRIBUTOR' } });
  render(<CuratorDataPendingPage />);
  expect(screen.getByTestId('access-denied')).toBeInTheDocument();
});



test('action modal cancel closes modal', async () => {
  mockListPending.mockResolvedValue([
    { id: 'abc-123', state: 'PENDING', disease_name: 'Flu', location: { city: 'Jakarta' } },
  ]);
  render(<CuratorDataPendingPage />);
  render(<CuratorDataPendingPage />);
  await waitFor(() => expect(mockListPending).toHaveBeenCalled());
  await waitFor(() => expect(screen.getAllByRole('button', { name: /^Terima$/i }).length).toBeGreaterThan(0));
  const terimaBtn = screen.getAllByRole('button', { name: /^Terima$/i })[0];
  fireEvent.click(terimaBtn);
  expect(screen.getByText(/Terima Pengajuan/i)).toBeInTheDocument();
  const cancelBtns = screen.getAllByRole('button', { name: /Batal/i });
  fireEvent.click(cancelBtns.pop() as HTMLElement);
  expect(screen.queryByText(/Terima Pengajuan/i)).not.toBeInTheDocument();
});


test('fetchPending HttpError string detail and generic error branch', async () => {
  const { HttpError }: any = require('../../api/contributorEvents');
  const err = Object.assign(new HttpError('fail'), { detail: 'denied' });
  mockListPending.mockRejectedValueOnce(err);
  render(<CuratorDataPendingPage />);
  await waitFor(() => expect(screen.getByText(/denied/i)).toBeInTheDocument());

  mockListPending.mockRejectedValueOnce(new Error('oops'));
  render(<CuratorDataPendingPage />);
  await waitFor(() => expect(screen.getByText(/Gagal memuat data pending/i)).toBeInTheDocument());
});

test('handleAction surfaces HttpError string detail', async () => {
  mockListPending.mockResolvedValue([
    { id: 'abc-123', state: 'PENDING', disease_name: 'Flu', location: { city: 'Jakarta' } },
  ]);
  const { HttpError }: any = require('../../api/contributorEvents');
  const err = Object.assign(new HttpError('err'), { detail: 'reject-denied' });
  mockReview.mockRejectedValue(err);

  render(<CuratorDataPendingPage />);
  await waitFor(() => expect(mockListPending).toHaveBeenCalled());
  await waitFor(() => expect(screen.getAllByRole('button', { name: /^Terima$/i }).length).toBeGreaterThan(0));
  fireEvent.click(screen.getAllByRole('button', { name: /^Terima$/i })[0]);
  const modal = screen.getByText(/Terima Pengajuan/i).closest('div') as HTMLElement;
  const submitBtn = screen.getAllByRole('button', { name: /^Terima$/i }).pop() as HTMLElement;
  fireEvent.click(submitBtn);
  await waitFor(() => expect(screen.getByText(/reject-denied/i)).toBeInTheDocument());
});

test('shows raw date for invalid created_at and news date in modal, and close button hides it', async () => {
  mockListPending.mockResolvedValue([
    {
      id: 'bad-date',
      disease_name: 'Flu',
      location: { city: 'Jakarta', province: 'DKI' },
      created_by: { name: 'X' },
      created_at: 'not-a-date',
      state: 'PENDING',
      news: {
        title: 'News',
        portal: 'Portal',
        type: 'Artikel',
        author: 'Reporter',
        date_published: 'not-a-date-news',
        url: 'https://example.com',
        content: 'Konten',
      },
    },
  ]);

  render(<CuratorDataPendingPage />);
  await waitFor(() => expect(screen.getByText(/not-a-date/i)).toBeInTheDocument());
  fireEvent.click(screen.getByText(/Lihat/i));
  await waitFor(() => expect(screen.getByText(/not-a-date-news/i)).toBeInTheDocument());
  fireEvent.click(screen.getByText(/Tutup/i));
  expect(screen.queryByText(/not-a-date-news/i)).not.toBeInTheDocument();
});

test('formatDate shows dash when created_at is missing', async () => {
  mockListPending.mockResolvedValue([
    { id: 'no-date', disease_name: 'NoDate', location: { city: 'Bandung' }, state: 'PENDING' },
  ]);

  render(<CuratorDataPendingPage />);
  await waitFor(() => expect(mockListPending).toHaveBeenCalled());
  // created_at missing should render as '-'
  await waitFor(() => expect(screen.getByText('-')).toBeInTheDocument());
});

test('fetchPending HttpError with object detail shows generic access message', async () => {
  const { HttpError }: any = require('../../api/contributorEvents');
  const err = Object.assign(new HttpError('fail'), { detail: { message: 'denied' } });
  mockListPending.mockRejectedValueOnce(err);
  render(<CuratorDataPendingPage />);
  await waitFor(() => expect(screen.getByText(/Gagal memuat data pending. Pastikan Anda memiliki akses./i)).toBeInTheDocument());
});

test('action modal textarea placeholder differs for approve and reject', async () => {
  mockListPending.mockResolvedValue([
    { id: 'abc-123', state: 'PENDING', disease_name: 'Flu', location: { city: 'Jakarta' } },
  ]);
  render(<CuratorDataPendingPage />);
  await waitFor(() => expect(mockListPending).toHaveBeenCalled());
  await waitFor(() => expect(screen.getAllByRole('button', { name: /^Terima$/i }).length).toBeGreaterThan(0));

  // Approve modal placeholder
  fireEvent.click(screen.getAllByRole('button', { name: /^Terima$/i })[0]);
  await screen.findByText(/Terima Pengajuan/i);
  expect(await screen.findByPlaceholderText(/Contoh: Data terlihat valid\./i)).toBeInTheDocument();
  const cancelBtns2 = screen.getAllByRole('button', { name: /Batal/i });
  fireEvent.click(cancelBtns2.pop() as HTMLElement);

  // Reject modal placeholder
  await waitFor(() => expect(screen.getAllByRole('button', { name: /^Tolak$/i }).length).toBeGreaterThan(0));
  fireEvent.click(screen.getAllByRole('button', { name: /^Tolak$/i })[0]);
  expect(await screen.findByPlaceholderText(/Contoh: Data tidak lengkap\./i)).toBeInTheDocument();
});

test('modal body renders textarea and explanation (covers modal block)', async () => {
  mockListPending.mockResolvedValue([
    { id: 'abc-123', state: 'PENDING', disease_name: 'Flu', location: { city: 'Jakarta' } },
  ]);
  render(<CuratorDataPendingPage />);
  await waitFor(() => expect(mockListPending).toHaveBeenCalled());
  await waitFor(() => expect(screen.getAllByRole('button', { name: /^Terima$/i }).length).toBeGreaterThan(0));
  fireEvent.click(screen.getAllByRole('button', { name: /^Terima$/i })[0]);
  expect(await screen.findByText(/Anda akan menyetujui pengajuan ini\./i)).toBeInTheDocument();
  expect(await screen.findByRole('textbox')).toBeInTheDocument();
  const cancelBtn = screen.getAllByRole('button', { name: /Batal/i }).pop() as HTMLElement;
  fireEvent.click(cancelBtn);
});

test('shows loading indicator while fetching and hides after', async () => {
  // control the promise so we can assert loading state
  let resolveFetch: ((value?: any) => void) | null = null;
  mockListPending.mockImplementation(
    () =>
      new Promise((res) => {
        resolveFetch = res;
      })
  );

  render(<CuratorDataPendingPage />);
  // loading should be visible while promise is pending
  expect(screen.getByText(/Memuat data pending/i)).toBeInTheDocument();

  // resolve with non-array so code sets items to [] branch later
  resolveFetch!([]);
  await waitFor(() => expect(screen.queryByText(/Memuat data pending/i)).not.toBeInTheDocument());
  await waitFor(() => expect(screen.getByText(/Tidak ada pengajuan pending/i)).toBeInTheDocument());
});

test('fetchPending handles non-array responses by showing empty state', async () => {
  // return something that's not an array
  mockListPending.mockResolvedValueOnce({ ok: true });
  render(<CuratorDataPendingPage />);
  await waitFor(() => expect(mockListPending).toHaveBeenCalled());
  await waitFor(() => expect(screen.getByText(/Tidak ada pengajuan pending/i)).toBeInTheDocument());
});


test('openAction clears previous error and resets note', async () => {
  mockListPending.mockResolvedValue([
    { id: 'abc-123', state: 'PENDING', disease_name: 'Flu', location: { city: 'Jakarta' } },
  ]);

  // Make the action fail so an error message is shown
  mockReview.mockRejectedValueOnce(new Error('boom'));

  render(<CuratorDataPendingPage />);
  await waitFor(() => expect(mockListPending).toHaveBeenCalled());
  await waitFor(() => expect(screen.getAllByRole('button', { name: /^Terima$/i }).length).toBeGreaterThan(0));

  // open approve modal, type a note and submit to trigger error
  fireEvent.click(screen.getAllByRole('button', { name: /^Terima$/i })[0]);
  const noteBox = await screen.findByPlaceholderText(/Contoh: Data terlihat valid\./i);
  fireEvent.change(noteBox, { target: { value: 'some note' } });
  const submitApprove = screen.getAllByRole('button', { name: /^Terima$/i }).pop() as HTMLElement;
  fireEvent.click(submitApprove);
  await waitFor(() => expect(screen.getByText(/Gagal memproses tindakan/i)).toBeInTheDocument());

  // Opening another action should clear the error message and reset note
  await waitFor(() => expect(screen.getAllByRole('button', { name: /^Tolak$/i }).length).toBeGreaterThan(0));
  fireEvent.click(screen.getAllByRole('button', { name: /^Tolak$/i })[0]);
  const rejBox = await screen.findByPlaceholderText(/Contoh: Data tidak lengkap\./i);
  expect(screen.queryByText(/Gagal memproses tindakan/i)).not.toBeInTheDocument();
  expect(rejBox).toHaveValue('');
});

test('normalizeRole trims and accepts lowercase/extra-space roles', async () => {
  // provide a role with spaces and lowercase to ensure normalizeRole/APPROVER_ROLES check
  mockUseAuth.mockReturnValueOnce({ user: { role: ' curator ' } });
  mockListPending.mockResolvedValueOnce([]);
  render(<CuratorDataPendingPage />);
  await waitFor(() => expect(mockListPending).toHaveBeenCalled());
});

test('view modal shows "Tidak ada data sumber." when news missing and shows review_note', async () => {
  mockListPending.mockResolvedValueOnce([
    {
      id: 'view-no-news',
      disease_name: 'Flu',
      location: {},
      state: 'PENDING',
      review_note: 'Reviewer note here',
    },
  ]);

  render(<CuratorDataPendingPage />);
  await waitFor(() => expect(mockListPending).toHaveBeenCalled());

  await waitFor(() => expect(screen.getAllByRole('button', { name: /^Lihat$/i }).length).toBeGreaterThan(0));
  fireEvent.click(screen.getAllByRole('button', { name: /^Lihat$/i })[0]);
  // modal should state that there is no news source
  await waitFor(() => expect(screen.getByText(/Tidak ada data sumber\./i)).toBeInTheDocument());
  // review note should be visible
  expect(screen.getByText(/Reviewer note here/i)).toBeInTheDocument();

  // close modal
  fireEvent.click(screen.getByText(/Tutup/i));
  expect(screen.queryByText(/Reviewer note here/i)).not.toBeInTheDocument();
});
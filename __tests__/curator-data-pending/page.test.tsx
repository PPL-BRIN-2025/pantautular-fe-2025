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

test('renders pending list, detail modal, and formatted date', async () => {
  mockListPending.mockResolvedValueOnce([
    {
      id: 'abc-123',
      disease_name: 'Flu',
      location: { city: 'Jakarta', province: 'DKI' },
      gender: 'male',
      age: 30,
      severity: 'insiden',
      status: 'biasa',
      state: 'PENDING',
      created_by: { name: 'Contributor', email: 'c@example.com' },
      created_at: '2024-01-02T00:00:00Z',
      news: {
        title: 'Judul Berita',
        portal: 'PortalX',
        type: 'Artikel',
        author: 'Reporter',
        date_published: '2024-01-01T00:00:00Z',
        url: 'https://example.com/news',
        img_url: 'https://example.com/img.jpg',
        content: 'Ringkasan berita',
      },
    },
  ]);

  render(<CuratorDataPendingPage />);
  render(<CuratorDataPendingPage />);
  await waitFor(() => expect(mockListPending).toHaveBeenCalled());
  await waitFor(() => expect(screen.getByText(/Flu/i)).toBeInTheDocument());
  await waitFor(() => expect(screen.getByText(/2024/i)).toBeInTheDocument()); // formatted created_at
  fireEvent.click(screen.getByText(/Lihat/i));
  await waitFor(() => expect(screen.getByText(/Judul Berita/i)).toBeInTheDocument());
  expect(screen.getByText(/PortalX/i)).toBeInTheDocument();
  expect(screen.getByText(/Reporter/i)).toBeInTheDocument();
  expect(screen.getByText(/Ringkasan berita/i)).toBeInTheDocument();
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

test('acting state shows loading and disables buttons', async () => {
  mockListPending.mockResolvedValue([
    { id: 'abc-123', state: 'PENDING', disease_name: 'Flu', location: { city: 'Jakarta' } },
  ]);
  let resolveReview: (() => void) | null = null;
  mockReview.mockImplementation(
    () =>
      new Promise((res) => {
        resolveReview = () => res({});
      })
  );
  render(<CuratorDataPendingPage />);
  render(<CuratorDataPendingPage />);
  await waitFor(() => expect(mockListPending).toHaveBeenCalled());
  await waitFor(() => expect(screen.getAllByRole('button', { name: /^Terima$/i }).length).toBeGreaterThan(0));
  const terimaBtns = screen.getAllByRole('button', { name: /^Terima$/i });
  fireEvent.click(terimaBtns[0]);
  const modal = screen.getByText(/Terima Pengajuan/i).closest('div') as HTMLElement;
  const submitBtn = screen.getAllByRole('button', { name: /^Terima$/i }).pop() as HTMLElement;
  fireEvent.click(submitBtn);
  expect(within(modal).getByText(/Memproses/i)).toBeInTheDocument();
  expect(submitBtn).toBeDisabled();
  resolveReview && resolveReview();
});

test('approving shows success and refetches', async () => {
  mockListPending.mockResolvedValue([
    { id: 'abc-123', disease_name: 'Flu', location: { city: 'Jakarta' }, state: 'PENDING' },
  ]);
  mockReview.mockResolvedValue({});
  render(<CuratorDataPendingPage />);
  render(<CuratorDataPendingPage />);
  await waitFor(() => expect(mockListPending).toHaveBeenCalled());
  await waitFor(() => expect(screen.getByText(/Terima/i)).toBeInTheDocument());
  fireEvent.click(screen.getByText(/Terima/i));
  const submitBtn = screen.getAllByRole('button', { name: /^Terima$/i }).pop() as HTMLElement;
  fireEvent.click(submitBtn);
  await waitFor(() => expect(mockReview).toHaveBeenCalledWith('abc-123', 'approve', ''));
  expect(mockListPending).toHaveBeenCalledTimes(2);
  await waitFor(() => expect(screen.getByText(/berhasil diterima/i)).toBeInTheDocument());
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

test('reject requires note then succeeds with note and refetches', async () => {
  mockListPending.mockResolvedValue([
    { id: 'abc-123', state: 'PENDING', disease_name: 'Flu', location: { city: 'Jakarta' } },
  ]);
  mockReview.mockResolvedValue({});
  render(<CuratorDataPendingPage />);
  render(<CuratorDataPendingPage />);
  await waitFor(() => expect(mockListPending).toHaveBeenCalled());
  await waitFor(() => expect(screen.getByText(/^Tolak$/i)).toBeInTheDocument());
  fireEvent.click(screen.getByText(/^Tolak$/i));
  const modal = screen.getByText(/Tolak Pengajuan/i).closest('div') as HTMLElement;
  const submitBtn = screen.getAllByRole('button', { name: /^Tolak$/i }).pop() as HTMLElement;
  fireEvent.click(submitBtn);
  expect(screen.getByText(/Catatan wajib diisi/i)).toBeInTheDocument();
  fireEvent.change(within(modal).getByRole('textbox'), { target: { value: 'note' } });
  fireEvent.click(submitBtn);
  await waitFor(() => expect(mockReview).toHaveBeenCalledWith('abc-123', 'reject', 'note'));
  expect(mockListPending).toHaveBeenCalledTimes(2);
  await waitFor(() => expect(screen.getByText(/berhasil ditolak/i)).toBeInTheDocument());
});

test('handleAction surfaces HttpError detail object', async () => {
  mockListPending.mockResolvedValue([
    { id: 'abc-123', state: 'PENDING', disease_name: 'Flu', location: { city: 'Jakarta' } },
  ]);
  const { HttpError }: any = require('../../api/contributorEvents');
  const detailErr = Object.assign(new HttpError('err'), { detail: { detail: 'forbidden' } });
  mockReview.mockRejectedValue(detailErr);

  render(<CuratorDataPendingPage />);
  render(<CuratorDataPendingPage />);
  await waitFor(() => expect(mockListPending).toHaveBeenCalled());
  await waitFor(() => expect(screen.getByText(/Terima/i)).toBeInTheDocument());
  fireEvent.click(screen.getByText(/Terima/i));
  const submitBtn2 = screen.getAllByRole('button', { name: /^Terima$/i }).pop() as HTMLElement;
  fireEvent.click(submitBtn2);
  await waitFor(() => expect(screen.getByText(/forbidden/i)).toBeInTheDocument());
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
  fireEvent.click(screen.getByText(/Terima/i));
  const modal = screen.getByText(/Terima Pengajuan/i).closest('div') as HTMLElement;
  const submitBtn = screen.getAllByRole('button', { name: /^Terima$/i }).pop() as HTMLElement;
  fireEvent.click(submitBtn);
  await waitFor(() => expect(screen.getByText(/reject-denied/i)).toBeInTheDocument());
});

test('handleAction surfaces generic error on unexpected failure', async () => {
  mockListPending.mockResolvedValue([
    { id: 'abc-123', state: 'PENDING', disease_name: 'Flu', location: { city: 'Jakarta' } },
  ]);
  mockReview.mockRejectedValue(new Error('explode'));
  render(<CuratorDataPendingPage />);
  render(<CuratorDataPendingPage />);
  await waitFor(() => expect(mockListPending).toHaveBeenCalled());
  await waitFor(() => expect(screen.getByText(/Terima/i)).toBeInTheDocument());
  fireEvent.click(screen.getByText(/Terima/i));
  const submitBtn3 = screen.getAllByRole('button', { name: /^Terima$/i }).pop() as HTMLElement;
  fireEvent.click(submitBtn3);
  await waitFor(() => expect(screen.getByText(/Gagal memproses tindakan/i)).toBeInTheDocument());
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
  await waitFor(() => expect(screen.getByText(/Terima/i)).toBeInTheDocument());

  // Approve modal placeholder
  fireEvent.click(screen.getByText(/Terima/i));
  const approveModal = screen.getByText(/Terima Pengajuan/i).closest('div') as HTMLElement;
  expect(within(approveModal).getByPlaceholderText(/Contoh: Data terlihat valid./i)).toBeInTheDocument();
  const cancelBtns2 = screen.getAllByRole('button', { name: /Batal/i });
  fireEvent.click(cancelBtns2.pop() as HTMLElement);

  // Reject modal placeholder
  await waitFor(() => expect(screen.getByText(/^Tolak$/i)).toBeInTheDocument());
  fireEvent.click(screen.getByText(/^Tolak$/i));
  const rejectModal = screen.getByText(/Tolak Pengajuan/i).closest('div') as HTMLElement;
  expect(within(rejectModal).getByPlaceholderText(/Contoh: Data tidak lengkap./i)).toBeInTheDocument();
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

test('action modal shows explanation text for approve and reject', async () => {
  mockListPending.mockResolvedValue([
    { id: 'abc-123', state: 'PENDING', disease_name: 'Flu', location: { city: 'Jakarta' } },
  ]);
  render(<CuratorDataPendingPage />);
  await waitFor(() => expect(mockListPending).toHaveBeenCalled());

  // Approve explanation
  await waitFor(() => expect(screen.getByText(/Terima/i)).toBeInTheDocument());
  fireEvent.click(screen.getByText(/Terima/i));
  const approveModal = screen.getByText(/Terima Pengajuan/i).closest('div') as HTMLElement;
  expect(within(approveModal).getByText(/Anda akan menyetujui pengajuan ini\./i)).toBeInTheDocument();
  expect(within(approveModal).getByPlaceholderText(/Contoh: Data terlihat valid./i)).toBeInTheDocument();
  // close
  const cancelBtn = within(approveModal).getAllByRole('button', { name: /Batal/i }).pop() as HTMLElement;
  fireEvent.click(cancelBtn);

  // Reject explanation
  await waitFor(() => expect(screen.getByText(/^Tolak$/i)).toBeInTheDocument());
  fireEvent.click(screen.getByText(/^Tolak$/i));
  const rejectModal = screen.getByText(/Tolak Pengajuan/i).closest('div') as HTMLElement;
  expect(within(rejectModal).getByText(/Berikan alasan penolakan untuk pengajuan ini\./i)).toBeInTheDocument();
  expect(within(rejectModal).getByPlaceholderText(/Contoh: Data tidak lengkap\./i)).toBeInTheDocument();
});

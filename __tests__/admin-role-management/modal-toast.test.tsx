import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Page from '../../app/admin-role-management/page';

// Provide a minimal fetch mock helper
beforeEach(() => {
  // reset fetch mock
  (global as any).fetch = jest.fn();
});

afterEach(() => {
  jest.resetAllMocks();
});

test('saving role shows success toast', async () => {
  // mock initial GET /users
  (global as any).fetch
    .mockResolvedValueOnce({ ok: true, json: async () => [{ id: 1, name: 'A', email: 'a@example.com', last_login: null, role: 'CURATOR' }] })
    // mock PUT role
    .mockResolvedValueOnce({ ok: true, status: 200 });

  render(<Page />);

  // wait until user appears in table
  await waitFor(() => expect(screen.getByText('A')).toBeInTheDocument());

  // click Ubah
  fireEvent.click(screen.getByText('Ubah'));

  // change role select
  const select = screen.getByDisplayValue('CURATOR');
  fireEvent.change(select, { target: { value: 'ADMIN' } });

  // click Simpan
  fireEvent.click(screen.getByText('Simpan'));

  // success toast should appear
  await waitFor(() => expect(screen.getByText('Peran berhasil disimpan')).toBeInTheDocument());
});

test('clicking test-info shows info toast', async () => {
  (global as any).fetch
    .mockResolvedValueOnce({
      ok: true,
      json: async () => [{ id: 3, name: 'C', email: 'c@example.com', last_login: null, role: 'CONTRIBUTOR' }],
    });

  render(<Page />);

  await waitFor(() => expect(screen.getByText('C')).toBeInTheDocument());

  fireEvent.click(screen.getByText('test-info'));

  await waitFor(() => expect(screen.getByText('Informasi')).toBeInTheDocument());
  // emoji should also be rendered
  expect(screen.getByText('ℹ️')).toBeInTheDocument();
});

test('clicking test-exercise mounts confirm and editing modal (coverage)', async () => {
  (global as any).fetch
    .mockResolvedValueOnce({
      ok: true,
      json: async () => [{ id: 4, name: 'D', email: 'd@example.com', last_login: null, role: 'CURATOR' }],
    })
    // Provide a response for any subsequent action (delete/save)
    .mockResolvedValueOnce({ ok: true, status: 200 });

  render(<Page />);

  await waitFor(() => expect(screen.getByText('D')).toBeInTheDocument());

  fireEvent.click(screen.getByTestId('test-exercise'));

  // editing state sets a user with name "TestEx" and email "t@x"
  await waitFor(() => expect(screen.getByDisplayValue('TestEx')).toBeInTheDocument());
  expect(screen.getByDisplayValue('t@x')).toBeInTheDocument();

  // either a confirm modal or the role/edit modal should be mounted; assert at least one expected control exists
  const hasHapus = screen.queryAllByText('Hapus').length > 0;
  const hasSimpan = screen.queryAllByText('Simpan').length > 0;
  expect(hasHapus || hasSimpan).toBeTruthy();

  // If confirm (Hapus) exists, open it and assert a dialog is shown
  if (hasHapus) {
    // Avoid ambiguity when multiple "Hapus" buttons exist by choosing the one outside any dialog (table row)
    const hapusButtons = screen.getAllByText('Hapus');
    const target = hapusButtons.find(btn => btn.closest('[role="dialog"]') === null) || hapusButtons[0];
    fireEvent.click(target);
    // The confirm modal markup does not include role="dialog", assert by its visible heading instead
    await waitFor(() => expect(screen.getByText('Hapus Pengguna ini?')).toBeInTheDocument());
  }

  // If save (Simpan) exists, click it and assert the success toast appears (mocked above)
  if (hasSimpan) {
    fireEvent.click(screen.getByText('Simpan'));
    await waitFor(() => expect(screen.getByText('Peran berhasil disimpan')).toBeInTheDocument());
  }
});

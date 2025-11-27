import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import Page from "../../app/admin-role-management/page";

beforeEach(() => {
  jest.resetAllMocks();
  // default GET users
  global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => [
    { id: 1, name: "Alice", email: "alice@mail.com", last_login: "2025-09-20", role: "Admin" },
    { id: 2, name: "Bob", email: "bob@mail.com", last_login: null, role: "CURATOR" },
  ] } as any);
  // ensure default window.confirm/alert behave normally unless test overrides
  try { delete (window as any).confirm; } catch {}
  try { delete (window as any).alert; } catch {}
});

test("confirm modal flow (non-legacy) deletes and shows toast", async () => {
  // first call GET
  (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, json: async () => [
    { id: 1, name: "Alice", email: "alice@mail.com", last_login: "2025-09-20", role: "Admin" },
    { id: 2, name: "Bob", email: "bob@mail.com", last_login: null, role: "CURATOR" },
  ] } as any);
  // second call DELETE
  (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, json: async () => ({}) } as any);

  // ensure window.confirm isn't mocked so modal path is used
  try { delete (window as any).confirm; } catch {}

  render(<Page />);
  await screen.findByText("Bob");

  // click Hapus to open modal
  fireEvent.click(screen.getAllByText("Hapus")[1]);

  // modal should appear
  await screen.findByText(/Hapus Pengguna ini\?/i);

  // click Hapus button inside modal
  const modalButtons = screen.getAllByText("Hapus");
  // the modal Hapus is the last one rendered inside modal
  fireEvent.click(modalButtons[modalButtons.length - 1]);

  // expect toast success
  await waitFor(() => expect(screen.getByText(/Pengguna berhasil dihapus/i)).toBeInTheDocument());
});

test("help panel toggle opens and closes", async () => {
  (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, json: async () => [
    { id: 1, name: "Alice", email: "alice@mail.com", last_login: "2025-09-20", role: "Admin" },
  ] } as any);

  render(<Page />);
  await screen.findByText("Alice");

  fireEvent.click(screen.getByRole("button", { name: /Bantuan/i }));
  expect(await screen.findByText(/Bantuan Pengelolaan Peran/i)).toBeInTheDocument();

  // close via close button
  fireEvent.click(screen.getByTitle("Tutup"));
  await waitFor(() => expect(screen.queryByText(/Bantuan Pengelolaan Peran/i)).not.toBeInTheDocument());
});

test("confirm modal cancel closes modal without deleting", async () => {
  // GET users
  (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, json: async () => [
    { id: 1, name: "Alice", email: "alice@mail.com", last_login: "2025-09-20", role: "Admin" },
    { id: 2, name: "Bob", email: "bob@mail.com", last_login: null, role: "CURATOR" },
  ] } as any);

  render(<Page />);
  await screen.findByText("Bob");

  // open confirm modal
  fireEvent.click(screen.getAllByText("Hapus")[1]);
  await screen.findByText(/Hapus Pengguna ini\?/i);

  // click Batal to trigger onCancel branch
  fireEvent.click(screen.getByText("Batal"));
  await waitFor(() => expect(screen.queryByText(/Hapus Pengguna ini\?/i)).not.toBeInTheDocument());

  // ensure only the initial GET was performed (no DELETE)
  expect((global.fetch as jest.Mock).mock.calls.length).toBe(1);
});

test("legacy confirm delete failure shows error toast and alert", async () => {
  // initial GET
  (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, json: async () => [
    { id: 1, name: "Alice", email: "alice@mail.com", last_login: "2025-09-20", role: "Admin" },
    { id: 2, name: "Bob", email: "bob@mail.com", last_login: null, role: "CURATOR" },
  ] } as any);

  // simulate DELETE failure (non-ok)
  (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: false, status: 500, text: async () => "oops" } as any);

  // mock window.confirm as Jest mock to trigger legacy flow
  (window as any).confirm = jest.fn().mockReturnValue(true);
  // spy window.alert so we can assert it was called
  const alertSpy = jest.fn();
  (window as any).alert = alertSpy;

  render(<Page />);
  await screen.findByText("Bob");

  // call onDelete via Hapus button; legacy confirm will be used
  fireEvent.click(screen.getAllByText("Hapus")[1]);

  // expect error toast appears
  await waitFor(() => expect(screen.getByText(/Gagal menghapus pengguna/i)).toBeInTheDocument());

  // alert should have been called
  expect(alertSpy).toHaveBeenCalled();
});

test("save role failure shows error toast and alert", async () => {
  // GET
  (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, json: async () => [
    { id: 1, name: "Alice", email: "alice@mail.com", last_login: "2025-09-20", role: "Admin" },
    { id: 2, name: "Bob", email: "bob@mail.com", last_login: null, role: "CURATOR" },
  ] } as any);

  // PUT returns non-ok
  (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: false, status: 500, text: async () => "bad" } as any);

  // spy alert
  const alertSpy = jest.fn();
  (window as any).alert = alertSpy;

  render(<Page />);
  await screen.findByText("Bob");

  // open modal and save with change
  fireEvent.click(screen.getAllByText("Ubah")[1]);
  await screen.findAllByText(/Edit Peran Pengguna/i);
  fireEvent.change(screen.getByLabelText("Peran"), { target: { value: "EXP_USER" } });
  fireEvent.click(screen.getByText("Simpan"));

  await waitFor(() => expect(screen.getByText(/Gagal menyimpan perubahan peran/i)).toBeInTheDocument());
  expect(alertSpy).toHaveBeenCalled();
});

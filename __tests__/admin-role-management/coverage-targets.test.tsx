import React from "react";
import { render, screen, waitFor, fireEvent, within } from "@testing-library/react";
import Page from "../../app/admin-role-management/page";

describe("Admin role management - coverage targets", () => {
  afterEach(() => {
    // restore default fetch mock
    // @ts-ignore
    global.fetch = undefined;
    jest.restoreAllMocks();
  });

  test("renders blocked access UI when GET /users returns 403 with detail", async () => {
    // mock fetch to return 403 with json body
    // @ts-ignore
    global.fetch = jest.fn(() =>
      Promise.resolve({
        status: 403,
        ok: false,
        json: async () => ({ detail: "You are not allowed" }),
      })
    );

    render(<Page />);

    // blocked access UI should appear
    await waitFor(() => expect(screen.getByText(/Akses Ditolak/i)).toBeInTheDocument());
    expect(screen.getByTestId("blocked-detail")).toHaveTextContent("You are not allowed");
  });

  test("shows generic error when GET /users returns non-ok and text body", async () => {
    // mock fetch to return 500 and text body
    // @ts-ignore
    global.fetch = jest.fn(() =>
      Promise.resolve({
        status: 500,
        ok: false,
        text: async () => "internal failure",
      })
    );

    render(<Page />);

    // the component should surface the error message
    await waitFor(() => expect(screen.getByText(/Error:/i)).toBeInTheDocument());
    expect(screen.getByText(/internal failure/i)).toBeInTheDocument();
  });

  test("opens RoleModal when clicking Ubah and closes on Batal", async () => {
    const users = [
      { id: 1, name: "Charlie", email: "c@x.com", last_login: null, role: "CURATOR" },
    ];

    // @ts-ignore
    global.fetch = jest.fn(() =>
      Promise.resolve({ status: 200, ok: true, json: async () => users })
    );

    render(<Page />);

    // wait for the user to appear
    await screen.findByText("Charlie");

    // click Ubah
    const ubah = screen.getByText("Ubah");
    fireEvent.click(ubah);

    // modal should appear
    await screen.findByText(/Edit Peran/i);

    // click Batal to close
    const batal = screen.getByText("Batal");
    fireEvent.click(batal);

    await waitFor(() => expect(screen.queryByText(/Edit Peran/i)).not.toBeInTheDocument());
  });

  test("opens confirm modal when clicking Hapus and cancels", async () => {
    const users = [
      { id: 2, name: "Dana", email: "d@x.com", last_login: null, role: "CONTRIBUTOR" },
    ];

    // @ts-ignore
    global.fetch = jest.fn((url, opts) => {
      if (!opts || opts.method === "GET") return Promise.resolve({ status: 200, ok: true, json: async () => users });
      return Promise.resolve({ status: 200, ok: true });
    });

  // ensure legacy native confirm mock (set globally in jest.setup) does not short-circuit to legacy path
  // so the UI ConfirmModal is used instead
  // @ts-ignore
  (window as any).confirm = undefined;

  render(<Page />);

    await screen.findByText("Dana");

    const hapus = screen.getByText("Hapus");
    // click to open confirm modal
    fireEvent.click(hapus);

    // modal should appear
    await screen.findByText(/Hapus Pengguna ini\?/i);

    // click Batal
    const batal = screen.getByText("Batal");
    fireEvent.click(batal);

    await waitFor(() => expect(screen.queryByText(/Hapus Pengguna ini\?/i)).not.toBeInTheDocument());
    // user still present
    expect(screen.getByText("Dana")).toBeInTheDocument();
  });

  test("confirm modal performs delete and shows success toast", async () => {
    const users = [
      { id: 3, name: "Eve", email: "e@x.com", last_login: null, role: "CURATOR" },
    ];

    // @ts-ignore
    global.fetch = jest.fn((url, opts) => {
      if (!opts || opts.method === "GET") return Promise.resolve({ status: 200, ok: true, json: async () => users });
      if (opts && opts.method === "DELETE") return Promise.resolve({ status: 200, ok: true });
      return Promise.resolve({ status: 200, ok: true });
    });

  // ensure native confirm is not mocked so the modal path is used
  // @ts-ignore
  (window as any).confirm = undefined;

  render(<Page />);

    await screen.findByText("Eve");

    const hapus = screen.getByText("Hapus");
    fireEvent.click(hapus);

    await screen.findByText(/Hapus Pengguna ini\?/i);

  // modal is appended after the table; pick the last 'Hapus' button which belongs to the modal
  const hapusButtons = screen.getAllByText("Hapus", { selector: "button" });
  const confirm = hapusButtons[hapusButtons.length - 1];
  // click confirm
  fireEvent.click(confirm);

    // success toast should appear
    await screen.findByText(/Pengguna berhasil dihapus/i);
    // user removed
    await waitFor(() => expect(screen.queryByText("Eve")).not.toBeInTheDocument());
  });

  test("shows success toast when saving role", async () => {
    const users = [
      { id: 4, name: "Fay", email: "f@x.com", last_login: null, role: "CURATOR" },
    ];

    // @ts-ignore
    global.fetch = jest.fn((url, opts) => {
      if (!opts || opts.method === "GET") return Promise.resolve({ status: 200, ok: true, json: async () => users });
      if (opts && opts.method === "PUT") return Promise.resolve({ status: 200, ok: true });
      return Promise.resolve({ status: 200, ok: true });
    });

    render(<Page />);
    await screen.findByText("Fay");

    // open role modal
    fireEvent.click(screen.getByText("Ubah"));
    await screen.findByText(/Edit Peran/i);

    // click Simpan
    fireEvent.click(screen.getByText("Simpan"));

    // success toast should appear (use testid)
    await screen.findByTestId("toast-success");
    expect(screen.getByTestId("toast-success")).toHaveTextContent(/Peran berhasil disimpan/i);
  });

  test("shows error toast when save fails", async () => {
    const users = [
      { id: 5, name: "Gus", email: "g@x.com", last_login: null, role: "CURATOR" },
    ];

    // @ts-ignore
    global.fetch = jest.fn((url, opts) => {
      if (!opts || opts.method === "GET") return Promise.resolve({ status: 200, ok: true, json: async () => users });
      if (opts && opts.method === "PUT") return Promise.resolve({ status: 500, ok: false, text: async () => "fail" });
      return Promise.resolve({ status: 200, ok: true });
    });

    render(<Page />);
    await screen.findByText("Gus");

    // open role modal
    fireEvent.click(screen.getByText("Ubah"));
    await screen.findByText(/Edit Peran/i);

    // click Simpan (this will fail)
    fireEvent.click(screen.getByText("Simpan"));

    // error toast should appear
    await screen.findByTestId("toast-error");
    expect(screen.getByTestId("toast-error")).toHaveTextContent(/Gagal menyimpan perubahan peran/i);
  });

  test("test-only: can push info toast (test helper)", async () => {
    const users = [
      { id: 6, name: "Hana", email: "h@x.com", last_login: null, role: "CURATOR" },
    ];

    // @ts-ignore
    global.fetch = jest.fn((url, opts) => {
      if (!opts || opts.method === "GET") return Promise.resolve({ status: 200, ok: true, json: async () => users });
      return Promise.resolve({ status: 200, ok: true });
    });

    render(<Page />);
    await screen.findByText("Hana");

    // click hidden test helper button to push info toast
    fireEvent.click(screen.getByTestId("test-push-info"));

    await screen.findByTestId("toast-info");
    expect(screen.getByTestId("toast-info")).toHaveTextContent(/Informasi/i);
  });

  test("test-only: exercise internal helpers and modals", async () => {
    const users = [
      { id: 7, name: "Ivy", email: "i@x.com", last_login: null, role: "CURATOR" },
    ];

    // @ts-ignore
    global.fetch = jest.fn((url, opts) => {
      if (!opts || opts.method === "GET") return Promise.resolve({ status: 200, ok: true, json: async () => users });
      return Promise.resolve({ status: 200, ok: true });
    });

  // clear any global confirm mock so ConfirmModal shows
  // @ts-ignore
  (window as any).confirm = undefined;

  render(<Page />);
    await screen.findByText("Ivy");

    // click hidden test-exercise button
    fireEvent.click(screen.getByTestId("test-exercise"));

    // Confirm modal and Role modal should appear
    await screen.findByText(/Hapus Pengguna ini\?/i);
    await screen.findByText(/Edit Peran/i);

  // close confirm modal (last modal 'Batal')
  const batalButtons = screen.getAllByText("Batal", { selector: "button" });
  // the confirm modal cancel appears later in the DOM; pick the last one
  fireEvent.click(batalButtons[batalButtons.length - 1]);
  await waitFor(() => expect(screen.queryByText(/Hapus Pengguna ini\?/i)).not.toBeInTheDocument());
  // close role modal: pick the next-to-last 'Batal' which belongs to role modal
  fireEvent.click(batalButtons[batalButtons.length - 2]);
  await waitFor(() => expect(screen.queryByText(/Edit Peran/i)).not.toBeInTheDocument());
  });

  test("toast close button removes toast and exercises class ternaries", async () => {
    const users = [
      { id: 8, name: "Jin", email: "j@x.com", last_login: null, role: "CURATOR" },
    ];

    // @ts-ignore
    global.fetch = jest.fn((url, opts) => {
      if (!opts || opts.method === "GET") return Promise.resolve({ status: 200, ok: true, json: async () => users });
      return Promise.resolve({ status: 200, ok: true });
    });

  // clear any global confirm mock so toast helpers and confirm modal use UI path
  // @ts-ignore
  (window as any).confirm = undefined;

  render(<Page />);
    await screen.findByText("Jin");

    // push only the info toast
    fireEvent.click(screen.getByTestId("test-push-info"));

    // find the info toast and its close button
    const info = await screen.findByTestId("toast-info");
    const closeBtn = within(info.closest('[data-testid^="toast-"]') as HTMLElement).getByText('×', { selector: 'button' });
    fireEvent.click(closeBtn);

    // after clicking close, the info toast should be removed
    await waitFor(() => expect(screen.queryByTestId("toast-info")).toBeNull());
  });
});

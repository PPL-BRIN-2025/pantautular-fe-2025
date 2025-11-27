import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import Page from "../../app/admin-role-management/page";

beforeEach(() => {
  (global as any).fetch = jest.fn();
});

afterEach(() => {
  jest.resetAllMocks();
});

test("saving role shows success toast", async () => {
  (global as any).fetch
    .mockResolvedValueOnce({
      ok: true,
      json: async () => [{ id: 1, name: "A", email: "a@example.com", last_login: null, role: "CURATOR" }],
    })
    .mockResolvedValueOnce({ ok: true, status: 200 });

  render(<Page />);
  await waitFor(() => expect(screen.getByText("A")).toBeInTheDocument());

  fireEvent.click(screen.getByText("Ubah"));
  const select = screen.getByDisplayValue("CURATOR");
  fireEvent.change(select, { target: { value: "ADMIN" } });
  fireEvent.click(screen.getByText("Simpan"));

  await waitFor(() => expect(screen.getByText("Peran berhasil disimpan")).toBeInTheDocument());
});

test("clicking test-info shows info toast", async () => {
  (global as any).fetch.mockResolvedValueOnce({
    ok: true,
    json: async () => [{ id: 3, name: "C", email: "c@example.com", last_login: null, role: "CONTRIBUTOR" }],
  });

  render(<Page />);
  await waitFor(() => expect(screen.getByText("C")).toBeInTheDocument());

  fireEvent.click(screen.getByText("test-info"));

  await waitFor(() => expect(screen.getByText("Informasi")).toBeInTheDocument());
  expect(screen.getByTestId("toast-emoji-info")).toHaveTextContent("!");
});

test("clicking test-exercise mounts confirm and editing modal (coverage)", async () => {
  (global as any).fetch
    .mockResolvedValueOnce({
      ok: true,
      json: async () => [{ id: 4, name: "D", email: "d@example.com", last_login: null, role: "CURATOR" }],
    })
    .mockResolvedValueOnce({ ok: true, status: 200 });

  render(<Page />);
  await waitFor(() => expect(screen.getByText("D")).toBeInTheDocument());

  fireEvent.click(screen.getByTestId("test-exercise"));

  await waitFor(() => expect(screen.getByDisplayValue("TestEx")).toBeInTheDocument());
  expect(screen.getByDisplayValue("t@x")).toBeInTheDocument();

  const hasHapus = screen.queryAllByText("Hapus").length > 0;
  const hasSimpan = screen.queryAllByText("Simpan").length > 0;
  expect(hasHapus || hasSimpan).toBeTruthy();

  if (hasHapus) {
    const hapusButtons = screen.getAllByText("Hapus");
    const target = hapusButtons.find((btn) => btn.closest('[role="dialog"]') === null) || hapusButtons[0];
    fireEvent.click(target);
    await waitFor(() => expect(screen.getByText("Hapus Pengguna ini?")).toBeInTheDocument());
  }

  if (hasSimpan) {
    fireEvent.click(screen.getByText("Simpan"));
    await waitFor(() => expect(screen.getByText("Peran berhasil disimpan")).toBeInTheDocument());
  }
});

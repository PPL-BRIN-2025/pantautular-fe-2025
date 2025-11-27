import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import Page, { authHeaders, getToken } from "../../app/admin-role-management/page";

jest.mock("../../app/components/Navbar", () => () => <div data-testid="navbar" />);
jest.mock("../../app/components/Footer", () => () => <div data-testid="footer" />);

const USERS = [
  { id: 1, name: "Alice", email: "alice@mail.com", last_login: "2025-09-20", role: "Admin" },
  { id: 2, name: "Bob", email: "bob@mail.com", last_login: null, role: "CURATOR" },
];

beforeEach(() => {
  jest.resetAllMocks();
  (global as any).fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => USERS });
  jest.spyOn(window, "alert").mockImplementation(() => {});
  Object.defineProperty(window, "location", {
    value: { href: "", pathname: "/admin-role-management" },
    writable: true,
  });
});

afterEach(() => {
  jest.restoreAllMocks();
});

test("renders users and filters via search", async () => {
  render(<Page />);
  await waitFor(() => expect(screen.getByText("Alice")).toBeInTheDocument());

  const input = screen.getByPlaceholderText(/Cari Nama/i);
  fireEvent.change(input, { target: { value: "bob" } });
  await waitFor(() => expect(screen.queryByText("Alice")).not.toBeInTheDocument());
  expect(screen.getByText("Bob")).toBeInTheDocument();
});

test("opens role modal and saves role (PUT ok)", async () => {
  (global as any).fetch
    .mockResolvedValueOnce({ ok: true, json: async () => USERS }) // GET
    .mockResolvedValueOnce({ ok: true, status: 200 }); // PUT

  render(<Page />);
  await screen.findByText("Bob");

  fireEvent.click(screen.getAllByText("Ubah")[1]);
  const [modalTitle] = await screen.findAllByText(/Edit Peran Pengguna/i);
  expect(modalTitle).toBeInTheDocument();

  fireEvent.change(screen.getByLabelText("Peran"), { target: { value: "EXP_USER" } });
  fireEvent.click(screen.getByText("Simpan"));

  await waitFor(() => expect(screen.queryByText(/Edit Peran Pengguna/i)).not.toBeInTheDocument());
});

test("DELETE flow removes row on success", async () => {
  (global as any).fetch
    .mockResolvedValueOnce({ ok: true, json: async () => USERS }) // GET
    .mockResolvedValueOnce({ ok: true, status: 200 }); // DELETE

  render(<Page />);
  await screen.findByText("Bob");

  fireEvent.click(screen.getAllByText("Hapus")[1]);
  fireEvent.click((await screen.findAllByText("Hapus")).pop()!);

  await waitFor(() => expect(screen.queryByText("Bob")).not.toBeInTheDocument());
});

test("authHeaders pulls token and API key", () => {
  localStorage.setItem("token", "abc123");
  (process as any).env.NEXT_PUBLIC_API_KEY = "key";
  const headers = authHeaders();
  expect(headers.Authorization).toBe("Bearer abc123");
  expect(headers["X-API-KEY"]).toBe("key");
});

test("getToken returns null when window is undefined", () => {
  const savedWindow = (global as any).window;
  // @ts-ignore
  delete (global as any).window;
  expect(getToken()).toBeNull();
  (global as any).window = savedWindow;
});

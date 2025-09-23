import { render, screen, waitFor } from "@testing-library/react";
import Page from "../../app/admin-role-management/page";

// Dummy data untuk GET /users
const USERS = [
  {
    id: 1,
    name: "Alice",
    email: "alice@mail.com",
    last_login: "2025-09-20",
    role: "Admin",
  },
  {
    id: 2,
    name: "Bob",
    email: "bob@mail.com",
    last_login: null,
    role: "CURATOR",
  },
];

beforeEach(() => {
  jest.resetAllMocks();

  // Mock global.fetch default -> return USERS
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => USERS,
  } as any);
});

describe("Admin Role Management Page (full render)", () => {
  test("loads users (GET ok), renders table and labels", async () => {
    render(<Page />);

    // Tunggu sampai baris user muncul
    await waitFor(() => {
      expect(screen.getByText("Alice")).toBeInTheDocument();
      expect(screen.getByText("Bob")).toBeInTheDocument();
    });

    // Pastikan header kolom tabel ada
    expect(
      screen.getByRole("columnheader", { name: /Username/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("columnheader", { name: /Email/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("columnheader", { name: /Role/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("columnheader", { name: /Action/i })
    ).toBeInTheDocument();
  });
});

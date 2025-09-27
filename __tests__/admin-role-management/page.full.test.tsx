import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import Page, { authHeaders, getToken } from "../../app/admin-role-management/page";

// Mock data users
const USERS = [
  { id: 1, name: "Alice", email: "alice@mail.com", last_login: "2025-09-20", role: "Admin" },
  { id: 2, name: "Bob", email: "bob@mail.com", last_login: null, role: "CURATOR" },
];

// Helper buat mock fetch response
function mockFetchOnce(data: any, ok = true) {
  (global.fetch as jest.Mock).mockResolvedValueOnce({
    ok,
    json: async () => data,
  } as any);
}

beforeEach(() => {
  jest.resetAllMocks();
  global.fetch = jest.fn();
  mockFetchOnce(USERS); // default GET users
  jest.spyOn(window, "confirm").mockImplementation(() => true);
  jest.spyOn(window, "alert").mockImplementation(() => {});
  localStorage.clear();
  document.cookie = "";
  delete (process as any).env.NEXT_PUBLIC_API_KEY;
});

describe("Admin Role Management Page (full render)", () => {
  test("smoke: loads users and renders table", async () => {
    render(<Page />);
    await waitFor(() => {
      expect(screen.getByText("Alice")).toBeInTheDocument();
      expect(screen.getByText("Bob")).toBeInTheDocument();
    });
  });

  test("search filters rows and shows empty state", async () => {
    render(<Page />);
    await screen.findByText("Alice");

    const input = screen.getByPlaceholderText(/Cari Nama/i);
    fireEvent.change(input, { target: { value: "bob" } });
    await waitFor(() => {
      expect(screen.queryByText("Alice")).not.toBeInTheDocument();
      expect(screen.getByText("Bob")).toBeInTheDocument();
    });

    fireEvent.change(input, { target: { value: "xyz" } });
    await waitFor(() => {
      expect(
        screen.getByText(/Tidak ada data yang cocok dengan pencarian/i)
      ).toBeInTheDocument();
    });
  });

  test("open modal and save role (PUT ok)", async () => {
    render(<Page />);
    await screen.findByText("Bob");

    fireEvent.click(screen.getAllByText("Ubah")[1]);
    await screen.findByText(/Edit Peran/i);

    const select = screen.getByLabelText("Peran");
    fireEvent.change(select, { target: { value: "EXP_USER" } });

    mockFetchOnce({}, true);
    fireEvent.click(screen.getByText("Simpan"));

    await waitFor(() => {
      expect(screen.queryByText(/Edit Peran/i)).not.toBeInTheDocument();
      expect(screen.getByText("EXP_USER")).toBeInTheDocument();
    });
  });

  test("PUT role error reverts and alerts", async () => {
    render(<Page />);
    await screen.findByText("Bob");

    fireEvent.click(screen.getAllByText("Ubah")[1]);
    await screen.findByText(/Edit Peran/i);

    const select = screen.getByLabelText("Peran");
    fireEvent.change(select, { target: { value: "EXP_USER" } });

    mockFetchOnce({ detail: "fail" }, false);
    fireEvent.click(screen.getByText("Simpan"));

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith("Gagal menyimpan perubahan peran");
    });
  });

  test("delete flow: confirm=true, DELETE ok removes row", async () => {
    (window.confirm as jest.Mock).mockReturnValue(true);
    render(<Page />);
    await screen.findByText("Bob");

    mockFetchOnce({}, true);
    fireEvent.click(screen.getAllByText("Hapus")[1]);

    await waitFor(() => {
      expect(screen.queryByText("Bob")).not.toBeInTheDocument();
    });
  });

  test("delete flow: DELETE fails -> list reverts and alerts", async () => {
    (window.confirm as jest.Mock).mockReturnValue(true);
    render(<Page />);
    await screen.findByText("Bob");

    mockFetchOnce({ detail: "fail" }, false);
    fireEvent.click(screen.getAllByText("Hapus")[1]);

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith("Gagal menghapus pengguna");
      expect(screen.getByText("Bob")).toBeInTheDocument();
    });
  });

  test("GET error path shows error message", async () => {
    jest.resetAllMocks();
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({ detail: "server error" }),
    } as any);

    render(<Page />);
    await waitFor(() => {
      expect(screen.getByText(/Error:/i)).toBeInTheDocument();
    });
  });

  test("GET error with non-JSON body shows generic message", async () => {
    jest.resetAllMocks();
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => {
        throw new Error("invalid json");
      },
    } as any);

    render(<Page />);
    await waitFor(() => {
      expect(screen.getByText(/Error:/i)).toBeInTheDocument();
    });
  });
});

describe("authHeaders branch coverage", () => {
  beforeEach(() => {
    localStorage.clear();
    document.cookie = "";
    delete (process as any).env.NEXT_PUBLIC_API_KEY;
  });

  test("includes Authorization from localStorage", () => {
    localStorage.setItem("token", "abc123");
    const headers = authHeaders();
    expect(headers.Authorization).toBe("Bearer abc123");
    expect(headers["Content-Type"]).toBe("application/json");
  });

  test("includes token from cookie when localStorage empty", () => {
    document.cookie = "access_token=xyz789";
    const headers = authHeaders();
    expect(headers.Authorization).toBe("Bearer xyz789");
  });

  test("includes X-API-KEY when env is set", () => {
    // pastikan tidak ada sisa nilai env lama
    delete (process as any).env.NEXT_PUBLIC_API_KEY;

    // set API_KEY sementara untuk test ini
    (process as any).env.NEXT_PUBLIC_API_KEY = "apikey";

    const headers = authHeaders();

    expect(headers["X-API-KEY"]).toBe("apikey");

    // cleanup lagi biar test lain gak keikut
    delete (process as any).env.NEXT_PUBLIC_API_KEY;
  });

  test("close modal using 'Batal' button", async () => {
    render(<Page />);
    await screen.findByText("Bob");

    // buka modal edit
    fireEvent.click(screen.getAllByText("Ubah")[1]);
    await screen.findByText(/Edit Peran/i);

    // klik tombol Batal
    fireEvent.click(screen.getByText("Batal"));

    // modal harus hilang
    await waitFor(() => {
      expect(screen.queryByText(/Edit Peran/i)).not.toBeInTheDocument();
    });
  });
});

describe("Extra branch coverage", () => {
  test("getToken returns null when window is undefined", async () => {
    const savedWindow = global.window;
    // @ts-ignore force undefined
    delete (global as any).window;

    const mod = await import("../../app/admin-role-management/page");
    const token = (mod as any).getToken();
    expect(token).toBeNull();

    // restore window
    global.window = savedWindow;
  });

  test("GET error path with broken JSON triggers catch{}", async () => {
    jest.resetAllMocks();
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => {
        throw new Error("bad json");
      },
    } as any);

    render(<Page />);
    await waitFor(() => {
      expect(screen.getByText(/Error:/i)).toBeInTheDocument();
    });
  });

  test("PUT error path with broken JSON triggers catch{}", async () => {
    jest.resetAllMocks();
    global.fetch = jest.fn()
      // first GET users
      .mockResolvedValueOnce({ ok: true, json: async () => USERS } as any)
      // then PUT fails with broken json
      .mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => { throw new Error("bad json"); },
      } as any);

    render(<Page />);
    await screen.findByText("Bob");

    fireEvent.click(screen.getAllByText("Ubah")[1]);
    await screen.findByText(/Edit Peran/i);

    const select = screen.getByLabelText("Peran");
    fireEvent.change(select, { target: { value: "EXP_USER" } });

    fireEvent.click(screen.getByText("Simpan"));

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith("Gagal menyimpan perubahan peran");
    });
  });

  test("DELETE error path with broken JSON triggers catch{}", async () => {
    jest.resetAllMocks();
    global.fetch = jest.fn()
      // GET users
      .mockResolvedValueOnce({ ok: true, json: async () => USERS } as any)
      // DELETE fails with broken json
      .mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => { throw new Error("bad json"); },
      } as any);

    (window.confirm as jest.Mock).mockReturnValue(true);

    render(<Page />);
    await screen.findByText("Bob");

    fireEvent.click(screen.getAllByText("Hapus")[1]);

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith("Gagal menghapus pengguna");
      expect(screen.getByText("Bob")).toBeInTheDocument();
    });
  });

  test("getToken returns null when window is undefined", () => {
    const savedWindow = global.window;
    // @ts-ignore force delete
    delete (global as any).window;

    expect(getToken()).toBeNull();

    global.window = savedWindow; // restore
  });

  test("GET error path triggers catch{} when res.json throws", async () => {
  global.fetch = jest.fn().mockResolvedValueOnce({
    ok: false,
    status: 500,
    json: async () => { throw new Error("parse error"); },
  } as any);

  render(<Page />);
  await waitFor(() => {
    expect(screen.getByText(/Error:/i)).toBeInTheDocument();
  });
});

test("PUT error path triggers catch{} when res.json throws", async () => {
  global.fetch = jest.fn()
    .mockResolvedValueOnce({ ok: true, json: async () => USERS } as any) // GET users
    .mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => { throw new Error("parse error"); },
    } as any); // PUT fail

  render(<Page />);
  await screen.findByText("Bob");

  fireEvent.click(screen.getAllByText("Ubah")[1]);
  await screen.findByText(/Edit Peran/i);

  const select = screen.getByLabelText("Peran");
  fireEvent.change(select, { target: { value: "EXP_USER" } });

  fireEvent.click(screen.getByText("Simpan"));

  await waitFor(() => {
    expect(window.alert).toHaveBeenCalledWith("Gagal menyimpan perubahan peran");
  });
});

test("DELETE error path triggers catch{} when res.json throws", async () => {
  global.fetch = jest.fn()
    .mockResolvedValueOnce({ ok: true, json: async () => USERS } as any) // GET
    .mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => { throw new Error("parse error"); },
    } as any); // DELETE fail

  (window.confirm as jest.Mock).mockReturnValue(true);

  render(<Page />);
  await screen.findByText("Bob");

  fireEvent.click(screen.getAllByText("Hapus")[1]);

  await waitFor(() => {
    expect(window.alert).toHaveBeenCalledWith("Gagal menghapus pengguna");
  });
});

test("uses fallback API_BASE when NEXT_PUBLIC_API_BASE_URL not set", async () => {
  delete (process as any).env.NEXT_PUBLIC_API_BASE_URL;

  global.fetch = jest.fn().mockResolvedValueOnce({
    ok: true,
    json: async () => USERS,
  } as any);

  render(<Page />);

  await waitFor(() => {
    expect(global.fetch).toHaveBeenCalledWith(
      "http://localhost:8000/admin-feature/users",
      expect.any(Object)
    );
  });
});

test("sets error fallback 'Load gagal' when e.message is undefined", async () => {
  global.fetch = jest.fn().mockImplementationOnce(() => {
    throw {}; // error tanpa message
  });

  render(<Page />);

  await waitFor(() => {
    expect(screen.getByText(/Error: Gagal memuat/)).toBeInTheDocument();
  });
});

test("cancel delete when confirm returns false", async () => {
  (window.confirm as jest.Mock).mockReturnValue(false);

  render(<Page />);
  await screen.findByText("Bob");

  fireEvent.click(screen.getAllByText("Hapus")[1]);

  await waitFor(() => {
    expect(screen.getByText("Bob")).toBeInTheDocument();
  });

  // pastikan fetch tidak dipanggil
  expect(global.fetch).toHaveBeenCalledTimes(1); // hanya GET awal
});

test("uses fallback API_BASE when NEXT_PUBLIC_API_BASE_URL is not set", async () => {
  const old = process.env.NEXT_PUBLIC_API_BASE_URL;
  delete (process as any).env.NEXT_PUBLIC_API_BASE_URL;

  global.fetch = jest.fn().mockResolvedValueOnce({
    ok: true,
    json: async () => USERS,
  } as any);

  render(<Page />);

  await waitFor(() => {
    const url = (global.fetch as jest.Mock).mock.calls[0][0];
    expect(url).toBe("http://localhost:8000/admin-feature/users");
  });

  // restore original env
  if (old) {
    process.env.NEXT_PUBLIC_API_BASE_URL = old;
  }
});


});
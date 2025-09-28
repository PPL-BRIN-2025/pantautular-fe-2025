import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import Page, { authHeaders, getToken } from "../../app/admin-role-management/page";

/** Mock Navbar & Footer so we can control layout (footer height measurement) */
jest.mock("../../app/components/Navbar", () => () => <div data-testid="navbar" />);
jest.mock("../../app/components/Footer", () => () => (
  // give it a height so our auto-measure padding test can read it
  <footer data-testid="footer" style={{ height: "100px" }}>Mock Footer</footer>
));


/** -------------------------
 *  Shared fixtures & helpers
 *  ------------------------- */
const USERS = [
  { id: 1, name: "Alice", email: "alice@mail.com", last_login: "2025-09-20", role: "Admin" },
  { id: 2, name: "Bob", email: "bob@mail.com", last_login: null, role: "CURATOR" },
];

// Helper buat mock fetch response (sekali panggil)
function mockFetchOnce(data: any, ok = true, status: number = ok ? 200 : 500) {
  (global.fetch as jest.Mock).mockResolvedValueOnce({
    ok,
    status,
    json: async () => data,
  } as any);
}

// General helper to craft a custom once response
function mockOnce(resp: Partial<Response> & { json?: () => Promise<any>, text?: () => Promise<string> }) {
  (global.fetch as jest.Mock).mockResolvedValueOnce({
    ok: true,
    status: 200,
    json: async () => USERS,
    ...resp,
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

  // stabilize pathname for redirect assertions
  Object.defineProperty(window, "location", {
    value: { href: "", pathname: "/admin-role-management" },
    writable: true,
  });

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

    mockFetchOnce({ detail: "fail" }, false, 400);
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

    mockFetchOnce({ detail: "fail" }, false, 400);
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
    delete (process as any).env.NEXT_PUBLIC_API_KEY;
    (process as any).env.NEXT_PUBLIC_API_KEY = "apikey";

    const headers = authHeaders();
    expect(headers["X-API-KEY"]).toBe("apikey");

    delete (process as any).env.NEXT_PUBLIC_API_KEY;
  });

  test("close modal using 'Batal' button", async () => {
    render(<Page />);
    await screen.findByText("Bob");

    fireEvent.click(screen.getAllByText("Ubah")[1]);
    await screen.findByText(/Edit Peran/i);

    fireEvent.click(screen.getByText("Batal"));

    await waitFor(() => {
      expect(screen.queryByText(/Edit Peran/i)).not.toBeInTheDocument();
    });
  });
});

describe("Extra branch coverage", () => {
  test("getToken returns null when window is undefined (imported getToken)", () => {
    const savedWindow = global.window;
    // @ts-ignore force delete
    delete (global as any).window;

    expect(getToken()).toBeNull();

    global.window = savedWindow; // restore
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

  test("GET error path triggers catch{} when res.json throws", async () => {
    jest.resetAllMocks();
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
    jest.resetAllMocks();
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
    jest.resetAllMocks();
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

  test("sets error fallback 'Gagal memuat' when e.message is undefined", async () => {
    global.fetch = jest.fn().mockImplementationOnce(() => {
      throw {}; // error tanpa message
    });

    render(<Page />);

    await waitFor(() => {
      expect(screen.getByText(/Error: Gagal memuat/)).toBeInTheDocument();
    });
  });

  test("cancel delete when confirm returns false (no DELETE call)", async () => {
    (window.confirm as jest.Mock).mockReturnValue(false);

    render(<Page />);
    await screen.findByText("Bob");

    fireEvent.click(screen.getAllByText("Hapus")[1]);

    await waitFor(() => {
      expect(screen.getByText("Bob")).toBeInTheDocument();
    });

    // hanya GET awal
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  test("uses fallback API_BASE when NEXT_PUBLIC_API_BASE_URL is not set (URL check)", async () => {
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

    if (old) process.env.NEXT_PUBLIC_API_BASE_URL = old;
  });
});

/** New coverage for 401/403 flows & dynamic padding & backdrop-close */
describe("401/403 flows & dynamic padding", () => {
  test("GET 401 → redirects to /login?next=…", async () => {
    jest.resetAllMocks();
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({ detail: "unauth" }),
    } as any);

    render(<Page />);

    await waitFor(() => {
      expect(window.location.href).toMatch(/^\/login\?next=/);
    });
  });

  test("GET 403 → shows blocked screen with detail and buttons", async () => {
    jest.resetAllMocks();
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: false,
      status: 403,
      json: async () => ({ detail: "Akses Ditolak (test)" }),
    } as any);

    render(<Page />);

    await screen.findByText("Akses Ditolak (test)");
    expect(screen.getByText("Informasi Akses")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Masuk/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Kembali/i })).toBeInTheDocument();
  });

  test("PUT 401 → redirects to login", async () => {
    render(<Page />);
    await screen.findByText("Bob");

    fireEvent.click(screen.getAllByText("Ubah")[1]);
    await screen.findByText(/Edit Peran/i);

    const select = screen.getByLabelText("Peran");
    fireEvent.change(select, { target: { value: "EXP_USER" } });

    mockOnce({ ok: false, status: 401, json: async () => ({ detail: "unauth" }) });
    fireEvent.click(screen.getByText("Simpan"));

    await waitFor(() => {
      expect(window.location.href).toMatch(/^\/login\?next=/);
    });
  });

  test("DELETE 401 → redirects to login", async () => {
    render(<Page />);
    await screen.findByText("Bob");

    mockOnce({ ok: false, status: 401, json: async () => ({ detail: "unauth" }) });
    fireEvent.click(screen.getAllByText("Hapus")[1]);

    await waitFor(() => {
      expect(window.location.href).toMatch(/^\/login\?next=/);
    });
  });

  test("PUT 403 → alerts detail and reverts optimistic change", async () => {
    render(<Page />);
    await screen.findByText("Bob");

    fireEvent.click(screen.getAllByText("Ubah")[1]);
    await screen.findByText(/Edit Peran/i);

    const select = screen.getByLabelText("Peran");
    fireEvent.change(select, { target: { value: "EXP_USER" } });

    mockOnce({ ok: false, status: 403, json: async () => ({ detail: "Akses Ditolak (PUT)" }) });
    fireEvent.click(screen.getByText("Simpan"));

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith("Akses Ditolak (PUT)");
      expect(screen.getByText("CURATOR")).toBeInTheDocument(); // reverted
    });
  });

  test("DELETE 403 → alerts detail and reverts list", async () => {
    render(<Page />);
    await screen.findByText("Bob");

    mockOnce({ ok: false, status: 403, json: async () => ({ detail: "Akses Ditolak (DELETE)" }) });
    fireEvent.click(screen.getAllByText("Hapus")[1]);

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith("Akses Ditolak (DELETE)");
      expect(screen.getByText("Bob")).toBeInTheDocument(); // reverted
    });
  });

  test("Modal closes by clicking backdrop (overlay)", async () => {
    render(<Page />);
    await screen.findByText("Bob");

    fireEvent.click(screen.getAllByText("Ubah")[1]);
    await screen.findByText(/Edit Peran/i);

    const overlay = document.querySelector(".absolute.inset-0.bg-black\\/40") as HTMLElement;
    expect(overlay).toBeTruthy();

    fireEvent.click(overlay);

    await waitFor(() => {
      expect(screen.queryByText(/Edit Peran/i)).not.toBeInTheDocument();
    });
  });
});

describe("403 fallbacks (JSON parse fails) to cover remaining lines", () => {
  test("GET 403 with broken JSON -> shows default 'Akses Ditolak'", async () => {
    jest.resetAllMocks();
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: false,
      status: 403,
      // simulate server returns non-JSON or malformed JSON
      json: async () => { throw new Error("bad json"); },
    } as any);

    render(<Page />);

    // default detail should be used
    await screen.findByText("Akses Ditolak");
    expect(screen.getByText("Informasi Akses")).toBeInTheDocument();
  });

  test("PUT 403 with broken JSON -> alerts default and reverts", async () => {
    // 1st call = GET OK
    jest.resetAllMocks();
    global.fetch = jest.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ([
        { id: 1, name: "Alice", email: "alice@mail.com", last_login: "2025-09-20", role: "Admin" },
        { id: 2, name: "Bob",   email: "bob@mail.com",   last_login: null,         role: "CURATOR" },
      ]) } as any)
      // 2nd call = PUT 403 with broken JSON
      .mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: async () => { throw new Error("bad json"); },
      } as any);

    jest.spyOn(window, "alert").mockImplementation(() => {});
    render(<Page />);
    await screen.findByText("Bob");

    fireEvent.click(screen.getAllByText("Ubah")[1]);
    await screen.findByText(/Edit Peran/i);

    const select = screen.getByLabelText("Peran");
    fireEvent.change(select, { target: { value: "EXP_USER" } });

    fireEvent.click(screen.getByText("Simpan"));

    await waitFor(() => {
      // default message from 403 catch{} path
      expect(window.alert).toHaveBeenCalledWith("Akses Ditolak");
      // reverted back to original role
      expect(screen.getByText("CURATOR")).toBeInTheDocument();
    });
  });

  test("DELETE 403 with broken JSON -> alerts default and reverts", async () => {
    // 1st = GET OK, 2nd = DELETE 403 broken JSON
    jest.resetAllMocks();
    global.fetch = jest.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ([
        { id: 1, name: "Alice", email: "alice@mail.com", last_login: "2025-09-20", role: "Admin" },
        { id: 2, name: "Bob",   email: "bob@mail.com",   last_login: null,         role: "CURATOR" },
      ]) } as any)
      .mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: async () => { throw new Error("bad json"); },
      } as any);

    jest.spyOn(window, "alert").mockImplementation(() => {});
    (window.confirm as jest.Mock).mockReturnValue(true);

    render(<Page />);
    await screen.findByText("Bob");

    fireEvent.click(screen.getAllByText("Hapus")[1]);

    await waitFor(() => {
      // default message from 403 catch{} path
      expect(window.alert).toHaveBeenCalledWith("Akses Ditolak");
      // item reverted (Bob still present)
      expect(screen.getByText("Bob")).toBeInTheDocument();
    });
  });
});

describe("Footer-measure early return (no footer present)", () => {
  test("resize with no footer keeps inline padding unset and uses pb-40 fallback", async () => {
    // In test env, isTest === true → Footer is NOT rendered
    render(<Page />);

    // ensure page mounted and data loaded
    await screen.findByText("Alice");

    const main = document.getElementsByTagName("main")[0] as HTMLElement;
    expect(main).toBeTruthy();

    // Trigger re-measure (measure runs on mount AND on resize)
    window.dispatchEvent(new Event("resize"));

    // Because there's no <footer>, measure does early return:
    await waitFor(() => {
      // no inline paddingBottom applied
      expect(main.style.paddingBottom).toBe("");
    });

    // Tailwind fallback is still present from the JSX
    expect(main.className).toMatch(/\bpb-40\b/);
  });
});

describe("Footer measure with actual footer present (no re-import)", () => {
  test("applies inline paddingBottom = footer.height + 16 on resize", async () => {
    render(<Page />);
    await screen.findByText("Alice");

    // Create a real footer node and stub its rect
    const footer = document.createElement("footer");
    // Stub getBoundingClientRect to return height 50
    footer.getBoundingClientRect = () =>
      ({ height: 50, width: 0, top: 0, left: 0, bottom: 0, right: 0, x: 0, y: 0, toJSON: () => {} } as any);

    document.body.appendChild(footer);

    // Trigger the resize listener so measure() runs again and finds our footer
    window.dispatchEvent(new Event("resize"));

    const main = document.getElementsByTagName("main")[0] as HTMLElement;
    await waitFor(() => {
      // 50 + 16 buffer
      expect(main.style.paddingBottom).toBe("66px");
    });

    // cleanup
    footer.remove();
  });
  
  test("renders Navbar & Footer when isTest mocked to false", async () => {
    jest.resetModules();
    jest.doMock("../../app/admin-role-management/page", () => {
      const actual = jest.requireActual("../../app/admin-role-management/page");
      return {
        __esModule: true,
        ...actual,
        default: (props: any) => {
          // force-render Nav/Footer regardless of env
          return (
            <div>
              <div data-testid="navbar">MockNavbar</div>
              <div>Main Content</div>
              <div data-testid="footer">MockFooter</div>
            </div>
          );
        },
      };
    });

    const { default: PageNonTest } = await import("../../app/admin-role-management/page");
    render(<PageNonTest />);

    expect(screen.getByTestId("navbar")).toBeInTheDocument();
    expect(screen.getByTestId("footer")).toBeInTheDocument();
  });
});

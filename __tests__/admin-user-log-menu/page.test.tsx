/** @jest-environment jsdom */
import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { okJson, resp } from "../utils/http";

jest.mock("next/link", () => {
  return ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href} data-testid="mock-link">
      {children}
    </a>
  );
});

jest.mock("../../app/components/Navbar", () => () => <div data-testid="navbar">Navbar</div>);
jest.mock("../../app/components/Footer", () => () => <div data-testid="footer">Footer</div>);

jest.mock("react-datepicker", () => {
  return function MockDatePicker({
    selected,
    onChange,
    placeholderText,
  }: {
    selected: Date | null;
    onChange: (date: Date | null) => void;
    placeholderText: string;
  }) {
    return (
      <input
        data-testid={`date-${placeholderText}`}
        value={selected ? selected.toISOString().slice(0, 10) : ""}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
          onChange(e.target.value ? new Date(e.target.value) : null)
        }
        placeholder={placeholderText}
      />
    );
  };
});

const makeLog = (n: number): {
  id: number;
  username: string | null;
  email: string | null;
  timestamp: string;
  action: string | null;
  detail: string | null;
} => ({
  id: n,
  username: `user-${n}`,
  email: `user${n}@mail.com`,
  timestamp: `2024-01-${String(n).padStart(2, "0")}T00:00:00Z`,
  action: `Action ${n}`,
  detail: `Detail ${n}`,
});

type LoadOpts = {
  env?: string;
  forceFullUi?: boolean;
};

const ORIGINAL_ENV = process.env.NODE_ENV;
const ORIGINAL_WINDOW = (globalThis as any).window;
const ORIGINAL_FETCH = global.fetch;
const ORIGINAL_LOCATION_DESCRIPTOR = Object.getOwnPropertyDescriptor(window, "location");
const ORIGINAL_LOCAL_STORAGE = global.localStorage;

const importPageModule = async (opts: LoadOpts = {}) => {
  const { env = ORIGINAL_ENV ?? "test", forceFullUi = false } = opts;
  const modulePath = require.resolve("../../app/admin-user-log-menu/page");
  delete require.cache[modulePath];
  const prevEnv = process.env.NODE_ENV;
  (process.env as any).NODE_ENV = env;
  if (forceFullUi) {
    (globalThis as any).__ADMIN_USER_LOG_FORCE_FULL_UI = true;
  } else {
    delete (globalThis as any).__ADMIN_USER_LOG_FORCE_FULL_UI;
  }
  const mod = await import("../../app/admin-user-log-menu/page");
  (process.env as any).NODE_ENV = prevEnv;
  return mod;
};

const loadPage = async (opts: LoadOpts = {}) => {
  const mod = await importPageModule(opts);
  return mod.default;
};

const loadTestHooks = async () => {
  const mod = await importPageModule();
  const hooks = (mod as any).__adminUserLogTestHooks || (globalThis as any).__adminUserLogTestHooks;
  if (!hooks) {
    throw new Error("admin user log test hooks unavailable");
  }
  return hooks;
};

beforeEach(() => {
  (global.fetch as any) = jest.fn();
  Object.defineProperty(window, "location", {
    value: { href: "", assign: jest.fn() },
    writable: true,
  });
  delete (globalThis as any).__ADMIN_USER_LOG_FORCE_FULL_UI;
  localStorage.clear();
  document.cookie = "access_token=; expires=Thu, 01 Jan 1970 00:00:00 GMT";
});

afterEach(() => {
  jest.clearAllMocks();
  if (typeof window === "undefined" && ORIGINAL_WINDOW) {
    (globalThis as any).window = ORIGINAL_WINDOW;
  }
  if (typeof window !== "undefined" && ORIGINAL_LOCATION_DESCRIPTOR) {
    Object.defineProperty(window, "location", ORIGINAL_LOCATION_DESCRIPTOR);
  }
  (global.fetch as any) = ORIGINAL_FETCH;
  global.localStorage = ORIGINAL_LOCAL_STORAGE;
});

describe("Admin user log menu page", () => {
  test("renders logs, filters client-side, and paginates", async () => {
    const logs = Array.from({ length: 12 }, (_, i) => makeLog(i + 1));
    logs[0] = { ...logs[0], username: "", email: null, action: null, detail: null };
    (global.fetch as jest.Mock).mockResolvedValue(
      okJson({
        count: logs.length,
        logs,
      })
    );

    const Page = await loadPage();
    render(<Page />);

    await screen.findByText("user-12");

    const search = screen.getByPlaceholderText(/Cari username/i);
    fireEvent.change(search, { target: { value: "user-3" } });
    expect(await screen.findByText("user-3")).toBeInTheDocument();
    expect(screen.queryByText("user-12")).not.toBeInTheDocument();

    fireEvent.change(search, { target: { value: "" } });
    const dateInputs = screen.getAllByTestId("date-dd/mm/yy");
    fireEvent.change(dateInputs[0], { target: { value: "2024-01-05" } });
    fireEvent.change(dateInputs[1], { target: { value: "2024-01-08" } });
    await screen.findByText("user-8");
    expect(screen.queryByText("user-2")).not.toBeInTheDocument();
    fireEvent.change(dateInputs[0], { target: { value: "" } });
    fireEvent.change(dateInputs[1], { target: { value: "" } });
    fireEvent.click(screen.getByRole("button", { name: /Next/i }));
    await screen.findByText("user-2");
    fireEvent.click(screen.getByRole("button", { name: /Prev/i }));
    await screen.findByText("user-12");
  });

  test("redirects to login on 401", async () => {
    (global.fetch as jest.Mock).mockResolvedValue(resp(401, {}));
    const Page = await loadPage();
    render(<Page />);
    await waitFor(() => expect(window.location.href).toContain("/login?next="));
  });

  test("shows error banner for unexpected failures", async () => {
    (global.fetch as jest.Mock).mockResolvedValue(resp(500, "Boom!"));
    const Page = await loadPage();
    render(<Page />);

    expect(await screen.findByText(/HTTP 500/i)).toBeInTheDocument();
  });

  test("surfaces unknown fetch rejection", async () => {
    (global.fetch as jest.Mock).mockRejectedValue({});
    const Page = await loadPage();
    render(<Page />);
    await screen.findByText(/Gagal memuat/i);
  });

  test("shows access denied view for 403 in production", async () => {
    (global.fetch as jest.Mock).mockResolvedValue(resp(403, { detail: "Admin only" }));
    const Page = await loadPage({ forceFullUi: true });
    render(<Page />);

    await screen.findByText(/Akses Ditolak/i);
    expect(screen.getByText(/Admin only/i)).toBeInTheDocument();
  });
});

describe("admin user log helper utilities", () => {
  test("getToken inspects storage, cookies, and server context", async () => {
    const __adminUserLogTestHooks = await loadTestHooks();
    expect(__adminUserLogTestHooks).toBeDefined();

    const originalWindow = (global as any).window;
    try {
      delete (global as any).window;
      expect(__adminUserLogTestHooks.getToken()).toBeNull();
    } finally {
      (global as any).window = originalWindow;
    }

    localStorage.setItem("token", "local-123");
    expect(__adminUserLogTestHooks.getToken()).toBe("local-123");
    localStorage.clear();

    document.cookie = "access_token=cookie-token";
    expect(__adminUserLogTestHooks.getToken()).toBe("cookie-token");
  });

  test("authHeaders attaches Authorization and API key when available", async () => {
    const prevKey = process.env.NEXT_PUBLIC_API_KEY;
    process.env.NEXT_PUBLIC_API_KEY = "demo-key";
    localStorage.setItem("access_token", "bearer-token");
    const __adminUserLogTestHooks = await loadTestHooks();
    const headers = __adminUserLogTestHooks.authHeaders();
    expect(headers.Authorization).toBe("Bearer bearer-token");
    expect(headers["X-API-KEY"]).toBe("demo-key");
    process.env.NEXT_PUBLIC_API_KEY = prevKey;
  });

  test("getNextPath returns pathname or fallback when window is missing", async () => {
    const __adminUserLogTestHooks = await loadTestHooks();
    window.location.pathname = "/custom-path";
    expect(__adminUserLogTestHooks.getNextPath()).toBe("/custom-path");

    const originalWindow = (global as any).window;
    try {
      delete (global as any).window;
      expect(__adminUserLogTestHooks.getNextPath()).toBe("/admin-user-log-menu");
    } finally {
      (global as any).window = originalWindow;
    }
  });

  test("fmtDate formats valid timestamps and guards invalid ones", async () => {
    const __adminUserLogTestHooks = await loadTestHooks();
    expect(__adminUserLogTestHooks.fmtDate(null)).toBe("-");
    expect(__adminUserLogTestHooks.fmtDate("bad-date")).toBe("-");
    expect(__adminUserLogTestHooks.fmtDate("2024-01-02T03:04:05Z")).toMatch(/2024-01-02/);
  });

  test("filterLogs applies search and date constraints", async () => {
    const __adminUserLogTestHooks = await loadTestHooks();
    const rows = [
      { ...makeLog(1), username: "alpha", timestamp: "2024-01-01T00:00:00Z" },
      { ...makeLog(2), username: "beta", timestamp: "2024-01-05T00:00:00Z" },
      { ...makeLog(3), username: null, email: null, action: null, detail: null },
    ];
    expect(__adminUserLogTestHooks.filterLogs(rows, "alpha", null, null)).toHaveLength(1);
    expect(__adminUserLogTestHooks.filterLogs(rows, "", new Date("2024-01-03"), null)).toHaveLength(2);
    expect(__adminUserLogTestHooks.filterLogs(rows, "", null, new Date("2024-01-02"))).toHaveLength(1);
    expect(__adminUserLogTestHooks.filterLogs(rows, "gamma", null, null)).toHaveLength(0);
    expect(__adminUserLogTestHooks.filterLogs(rows, "", null, null)).toHaveLength(3);
  });

  test("interpretFetchError classifies responses", async () => {
    const __adminUserLogTestHooks = await loadTestHooks();
    expect(__adminUserLogTestHooks.interpretFetchError("403:Custom")).toEqual({
      blocked403Detail: "Custom",
      errMessage: null,
    });
    expect(__adminUserLogTestHooks.interpretFetchError("403:")).toEqual({
      blocked403Detail: "Akses Ditolak",
      errMessage: null,
    });
    expect(__adminUserLogTestHooks.interpretFetchError("Unauthorized")).toEqual({
      blocked403Detail: undefined,
      errMessage: null,
    });
    expect(__adminUserLogTestHooks.interpretFetchError("")).toEqual({
      blocked403Detail: undefined,
      errMessage: "Gagal memuat",
    });
  });

  test("fetchAllLogs reports success", async () => {
    const payload = { count: 1, logs: [makeLog(1)] };
    (global.fetch as jest.Mock).mockResolvedValue(okJson(payload));
    const __adminUserLogTestHooks = await loadTestHooks();
    await expect(__adminUserLogTestHooks.fetchAllLogs()).resolves.toEqual(payload);
  });

  test("fetchAllLogs handles 401 redirects with and without window", async () => {
    (global.fetch as jest.Mock).mockResolvedValue(resp(401, {}));
    const __adminUserLogTestHooks = await loadTestHooks();
    await expect(__adminUserLogTestHooks.fetchAllLogs()).rejects.toThrow("Unauthorized");
    expect(window.location.href).toContain("/login?next=");

    const originalWindow = (global as any).window;
    try {
      delete (global as any).window;
      (global.fetch as jest.Mock).mockResolvedValue(resp(401, {}));
      await expect(__adminUserLogTestHooks.fetchAllLogs()).rejects.toThrow("Unauthorized");
    } finally {
      (global as any).window = originalWindow;
    }
  });

  test("fetchAllLogs surfaces 403 and generic server errors", async () => {
    (global.fetch as jest.Mock).mockResolvedValue(resp(403, { detail: "Admins only" }));
    const __adminUserLogTestHooks = await loadTestHooks();
    await expect(__adminUserLogTestHooks.fetchAllLogs()).rejects.toThrow("403:Admins only");

    (global.fetch as jest.Mock).mockResolvedValue(resp(500, "Boom"));
    await expect(__adminUserLogTestHooks.fetchAllLogs()).rejects.toThrow(/HTTP 500/);
  });

  test("fetchAllLogs falls back when detail missing or text() rejects", async () => {
    const __adminUserLogTestHooks = await loadTestHooks();
    (global.fetch as jest.Mock).mockResolvedValue(resp(403, {}));
    await expect(__adminUserLogTestHooks.fetchAllLogs()).rejects.toThrow("403:Akses Ditolak");

    const rejectingResp = {
      status: 500,
      ok: false,
      text: () => Promise.reject(new Error("fail")),
      json: () => Promise.resolve({}),
    } as unknown as Response;
    (global.fetch as jest.Mock).mockResolvedValue(rejectingResp);
    await expect(__adminUserLogTestHooks.fetchAllLogs()).rejects.toThrow(/HTTP 500/);
  });
});

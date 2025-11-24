import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { okJson, resp } from "../utils/http";

jest.setTimeout(120000);

const mockPush = jest.fn();
const mockReplace = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
    prefetch: jest.fn(),
  }),
}));

// isolate Navbar/Footer so layout changes don't break tests
jest.mock("../../app/components/Navbar", () => () => <div data-testid="mock-navbar">Navbar</div>);
jest.mock("../../app/components/Footer", () => () => <div data-testid="mock-footer">Footer</div>);

const mockUseAuth = jest.fn();
jest.mock("../../app/auth/hooks/useAuth", () => ({
  useAuth: () => mockUseAuth(),
}));

// --- helpers to match text that may be split across multiple nodes ---
const byTextContent = (t: string) =>
  (_: string, node?: Element | null) => node?.textContent?.trim() === t;

const byTextContentLoose = (re: RegExp) =>
  (_: string, node?: Element | null) => {
    const txt = node?.textContent?.replace(/\s+/g, " ").trim() ?? "";
    return re.test(txt);
  };

import CuratorDataManagementPage, {
  __curatorDataTestHooks,
} from "../../app/curator-data-management/page";

const ORIGINAL_LOCATION = window.location;
const toUrl = (input: RequestInfo | URL): string =>
  typeof input === "string" ? input : (input as Request).url;

beforeEach(() => {
  (global.fetch as any) = jest.fn();

  delete (window as any).location;
  (window as any).location = { href: "/" };
  localStorage.clear();
  localStorage.setItem("accessToken", "test-token");
  document.cookie = "access_token=; expires=Thu, 01 Jan 1970 00:00:00 GMT";

  mockPush.mockClear();
  mockReplace.mockClear();
  mockUseAuth.mockReturnValue({
    user: { role: "CURATOR" },
    getAccessToken: jest.fn().mockResolvedValue("test-token"),
  });
});

afterAll(() => {
  (window as any).location = ORIGINAL_LOCATION as any;
});

//
// 403
//
test("403 → shows generic fetch error", async () => {
  (global.fetch as jest.Mock).mockImplementation(() =>
    resp(403, { detail: "Only CURATOR role allowed" })
  );

  render(<CuratorDataManagementPage />);
  expect(
    await screen.findByText(/Gagal mengambil data audit trail/i)
  ).toBeInTheDocument();
});

describe("CuratorDataManagementPage • data & fetch behavior", () => {
  test("renders rows, shows counts, and navigates to edit screen", async () => {
    (global.fetch as jest.Mock).mockResolvedValue(
      okJson({
        data: [
          { data_id: "PT-001", title: "Kasus Demam", last_edited: "2024-01-01T00:00:00Z", submitted_by: "A" },
          { data_id: "PT-002", title: "Kasus Flu", last_edited: null, submitted_by: null },
        ],
        total: 2,
      })
    );

    render(<CuratorDataManagementPage />);
    await screen.findByText("PT-001");
    fireEvent.click(screen.getAllByText(/Lihat Data/i)[0]);
    expect(mockPush).toHaveBeenCalledWith("/curator-edit-delete-data?id=PT-001");
    expect(
      await screen.findByText(byTextContentLoose(/^Menampilkan\s*2\s*dari\s*2\s*data$/i))
    ).toBeInTheDocument();
  });

  test("handles 401 by clearing token and redirecting to login", async () => {
    localStorage.setItem("accessToken", "persist");
    (global.fetch as jest.Mock).mockResolvedValue(resp(401, { detail: "expired" }));

    render(<CuratorDataManagementPage />);
    await waitFor(() =>
      expect(mockReplace).toHaveBeenCalledWith("/login?next=%2Fcurator-data-management")
    );
    await screen.findByText(/Sesi berakhir/i);
    expect(localStorage.getItem("accessToken")).toBeNull();
  });

  test("falls back to stored token when getAccessToken rejects", async () => {
    localStorage.setItem("accessToken", "ls-token");
    mockUseAuth.mockReturnValue({
      user: { role: "CURATOR" },
      getAccessToken: jest.fn().mockRejectedValue(new Error("boom")),
    });
    (global.fetch as jest.Mock).mockImplementation((_url, init: RequestInit) => {
      expect((init?.headers as Record<string, string>).Authorization).toBe("Bearer ls-token");
      return okJson({ data: [], total: 0 });
    });

    render(<CuratorDataManagementPage />);
    await screen.findByText(/Tidak ada data yang cocok/i);
  });

  test("ignores abort errors without surfacing toast", async () => {
    const abortError = new Error("aborted");
    abortError.name = "AbortError";
    (global.fetch as jest.Mock).mockRejectedValue(abortError);

    render(<CuratorDataManagementPage />);
    await waitFor(() =>
      expect((global.fetch as jest.Mock).mock.calls.length).toBeGreaterThan(0)
    );
    expect(screen.queryByText(/Gagal mengambil data audit trail/i)).toBeNull();
  });
});

//
// Data Render
//
describe("CuratorDataManagementPage ??? Filtering", () => {
  test("typing in search triggers fetch with ?search=??? and resets to page 1", async () => {
    const searchHitUrls: string[] = [];
    (global.fetch as jest.Mock).mockImplementation((input: RequestInfo) => {
      const url = toUrl(input);
      const params = new URL(url).searchParams;
      if (params.get("search")) {
        searchHitUrls.push(url);
        expect(params.get("page")).toBe("1");
        return okJson({
          data: [
            {
              id: 1,
              data_id: "PT-100",
              title: "Penyakit Kulit",
              last_edited: null,
              submitted_by: null,
            },
          ],
          page: 1,
          pageSize: 10,
          total: 1,
        });
      }
      return okJson({
        data: Array.from({ length: 10 }, (_, i) => ({
          id: i + 1,
          data_id: `ID${i + 1}`,
          title: `Judul ${i + 1}`,
          last_edited: null,
          submitted_by: null,
        })),
        page: 1,
        pageSize: 10,
        total: 10,
      });
    });

    render(<CuratorDataManagementPage />);

    const input = await screen.findByPlaceholderText(/Cari ID \/ Judul/i);
    fireEvent.change(input, { target: { value: "penyakit" } });

    await waitFor(() => expect(searchHitUrls.length).toBeGreaterThan(0));
    await waitFor(() =>
      expect(
        (global.fetch as jest.Mock).mock.calls.some(
          ([url]) => String(url).includes("search=penyakit") && String(url).includes("page=1")
        )
      ).toBe(true)
    );
    await screen.findByText(byTextContentLoose(/^1\s*\/\s*1$/));
  });

  test("resets pagination when filter reduces page count", async () => {
    (global.fetch as jest.Mock).mockImplementation((input: RequestInfo) => {
      const url = toUrl(input);
      const params = new URL(url).searchParams;
      const currentPage = params.get("page");
      const search = params.get("search");

      if (search) {
        expect(search).toBe("kuratorx");
        expect(currentPage).toBe("1");
        return okJson({
          data: [{ id: 42, data_id: "ID42", title: "KuratorX", last_edited: null, submitted_by: null }],
          page: 1,
          pageSize: 10,
          total: 1,
        });
      }

      if (currentPage === "2") {
        return okJson({
          data: Array.from({ length: 10 }, (_, i) => ({
            id: i + 11,
            data_id: `ID${i + 11}`,
            title: `T${i + 11}`,
            last_edited: null,
            submitted_by: null,
          })),
          page: 2,
          pageSize: 10,
          total: 20,
        });
      }

      return okJson({
        data: Array.from({ length: 10 }, (_, i) => ({
          id: i + 1,
          data_id: `ID${i + 1}`,
          title: `T${i + 1}`,
          last_edited: null,
          submitted_by: null,
        })),
        page: 1,
        pageSize: 10,
        total: 20,
      });
    });

    render(<CuratorDataManagementPage />);

    await screen.findByText(byTextContentLoose(/^Menampilkan\s*10\s*dari\s*20\s*data$/i));
    const nextBtn = screen.getByText(/Next/i);
    fireEvent.click(nextBtn);
    fireEvent.click(screen.getByText(/Prev/i));

    await waitFor(() =>
      expect(
        (global.fetch as jest.Mock).mock.calls.some(([url]) => String(url).includes("page=2"))
      ).toBe(true)
    );

    const input = screen.getByPlaceholderText(/Cari ID/i);
    fireEvent.change(input, { target: { value: "kuratorx" } });

    await waitFor(() =>
      expect(
        (global.fetch as jest.Mock).mock.calls.some(
          ([url]) => String(url).includes("search=kuratorx") && String(url).includes("page=1")
        )
      ).toBe(true)
    );
    await screen.findByText(byTextContentLoose(/^1\s*\/\s*1$/));
  });
});

describe("CuratorDataManagementPage access control flows", () => {
  test("redirects unauthenticated users to login", async () => {
    mockUseAuth.mockReturnValue({ user: null, getAccessToken: jest.fn() });
    render(<CuratorDataManagementPage />);
    await waitFor(() =>
      expect(mockReplace).toHaveBeenCalledWith("/login?next=%2Fcurator-data-management")
    );
  });

  test("renders forbidden view for unsupported roles", async () => {
    mockUseAuth.mockReturnValue({ user: { role: "CONTRIBUTOR" }, getAccessToken: jest.fn() });
    render(<CuratorDataManagementPage />);
    expect(await screen.findByText(/Akses Kurator Ditolak/i)).toBeInTheDocument();
  });
});

describe("curator data helper utilities", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test("obtainAccessToken prefers hook response and falls back to storage", async () => {
    localStorage.setItem("accessToken", "ls");
    await expect(
      __curatorDataTestHooks.obtainAccessToken(async () => "from-hook")
    ).resolves.toBe("from-hook");

    const rejecting = jest.fn().mockRejectedValue(new Error("fail"));
    await expect(__curatorDataTestHooks.obtainAccessToken(rejecting)).resolves.toBe("ls");

    const throwing = () => {
      throw new Error("sync");
    };
    localStorage.clear();
    await expect(__curatorDataTestHooks.obtainAccessToken(throwing as any)).resolves.toBeNull();

    localStorage.clear();
    await expect(__curatorDataTestHooks.obtainAccessToken(null)).resolves.toBeNull();

    const getItemSpy = jest
      .spyOn(Storage.prototype, "getItem")
      .mockImplementation(() => {
        throw new Error("blocked");
      });
    await expect(__curatorDataTestHooks.obtainAccessToken(null)).resolves.toBeNull();
    getItemSpy.mockRestore();
  });

  test("executeAuditFetch uses Authorization header when token is present", async () => {
    const fetchImpl = jest.fn(async (_url, init: RequestInit) => {
      expect((init?.headers as Record<string, string>).Authorization).toBe("Bearer tok");
      return okJson({ ok: true });
    });
    const ac = new AbortController();
    const result = await __curatorDataTestHooks.executeAuditFetch({
      url: "http://api",
      token: "tok",
      signal: ac.signal,
      fetchImpl,
    });
    expect(await result.res.json()).toEqual({ ok: true });
  });

  test("executeAuditFetch uses credentialed request when token missing", async () => {
    const fetchImpl = jest.fn(async (_url, init: RequestInit) => {
      expect(init?.credentials).toBe("include");
      return okJson({ ok: true });
    });
    const ac = new AbortController();
    await __curatorDataTestHooks.executeAuditFetch({
      url: "http://api",
      token: null,
      signal: ac.signal,
      fetchImpl,
    });
  });

  test("executeAuditFetch throws when no response is returned", async () => {
    const fetchImpl = jest.fn(async () => undefined as any);
    const ac = new AbortController();
    await expect(
      __curatorDataTestHooks.executeAuditFetch({
        url: "http://api",
        token: "tok",
        signal: ac.signal,
        fetchImpl,
      })
    ).rejects.toThrow("No response");
  });

  test("clampPrevPage and clampNextPage respect bounds", () => {
    expect(__curatorDataTestHooks.clampPrevPage(5)).toBe(4);
    expect(__curatorDataTestHooks.clampPrevPage(1)).toBe(1);
    expect(__curatorDataTestHooks.clampNextPage(1, 5)).toBe(2);
    expect(__curatorDataTestHooks.clampNextPage(5, 5)).toBe(5);
  });

  test("normalizeRole trims and uppercases values", () => {
    expect(__curatorDataTestHooks.normalizeRole(" admin ")).toBe("ADMIN");
    expect(__curatorDataTestHooks.normalizeRole(undefined)).toBe("");
  });

  test("resolveEffectiveUser reads stored user when hook value missing", () => {
    localStorage.setItem("user", JSON.stringify({ role: "CURATOR" }));
    expect(__curatorDataTestHooks.resolveEffectiveUser(null)).toEqual({ role: "CURATOR" });
    localStorage.clear();
    expect(__curatorDataTestHooks.resolveEffectiveUser(null)).toBeNull();
  });

  test("maybeClampPage requests update when current page exceeds pageCount", () => {
    const ref = { current: false };
    expect(__curatorDataTestHooks.maybeClampPage(5, 2, ref)).toBe(2);
    expect(ref.current).toBe(false);
    const firstRef = { current: true };
    expect(__curatorDataTestHooks.maybeClampPage(3, 10, firstRef)).toBeNull();
    expect(firstRef.current).toBe(false);
  });

  test("clampPageIfNeeded triggers updater when clamp required", () => {
    const setPage = jest.fn();
    const ref = { current: false };
    __curatorDataTestHooks.clampPageIfNeeded(5, 1, ref, setPage);
    expect(setPage).toHaveBeenCalledWith(1);
    jest.clearAllMocks();
    const ref2 = { current: true };
    __curatorDataTestHooks.clampPageIfNeeded(1, 5, ref2, setPage);
    expect(setPage).not.toHaveBeenCalled();
  });

  test("parseAuditResponse returns rows and throws on errors", () => {
    const rowsPayload = { data: [{ data_id: "A", title: "T" }], total: 10 };
    const okResponse = { ok: true, status: 200 } as Response;
    const parsed = __curatorDataTestHooks.parseAuditResponse(okResponse, JSON.stringify(rowsPayload));
    expect(parsed.rows).toHaveLength(1);
    expect(parsed.totalCount).toBe(10);

    const rowsOnlyPayload = { data: [{ data_id: "B", title: "U" }] };
    const rowsOnly = __curatorDataTestHooks.parseAuditResponse(
      { ok: true, status: 200 } as Response,
      JSON.stringify(rowsOnlyPayload)
    );
    expect(rowsOnly.totalCount).toBe(1);

    const emptyParsed = __curatorDataTestHooks.parseAuditResponse(
      { ok: true, status: 200 } as Response,
      ""
    );
    expect(emptyParsed.rows).toEqual([]);
    expect(emptyParsed.totalCount).toBe(0);

    const badResponse = { ok: false, status: 500 } as Response;
    try {
      __curatorDataTestHooks.parseAuditResponse(badResponse, "Boom");
      fail("should throw");
    } catch (err: any) {
      expect(err.message).toMatch(/Server returned 500/);
    }
  });

  test("handleUnauthorizedRedirect removes token and redirects", () => {
    const replace = jest.fn();
    expect(
      __curatorDataTestHooks.handleUnauthorizedRedirect({ status: 200 } as Response, replace)
    ).toBe(false);

    localStorage.setItem("accessToken", "tok");
    expect(
      __curatorDataTestHooks.handleUnauthorizedRedirect({ status: 401 } as Response, replace)
    ).toBe(true);
    expect(localStorage.getItem("accessToken")).toBeNull();
    expect(replace).toHaveBeenCalledWith("/login?next=%2Fcurator-data-management");

    const removeSpy = jest.spyOn(Storage.prototype, "removeItem").mockImplementation(() => {
      throw new Error("fail");
    });
    localStorage.setItem("accessToken", "tok");
    __curatorDataTestHooks.handleUnauthorizedRedirect({ status: 401 } as Response, () => {});
    removeSpy.mockRestore();
  });

  test("isAbortError detects abort-like errors", () => {
    expect(__curatorDataTestHooks.isAbortError({ name: "AbortError" })).toBe(true);
    expect(__curatorDataTestHooks.isAbortError({ name: "Other" })).toBe(false);
  });
});

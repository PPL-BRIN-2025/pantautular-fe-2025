import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import ExpertDataManagementPage, {
  buildViewHref,
  filterRowsByQuery,
  getEmptyStateMessage,
  getToken,
  getTokenForDelete,
  hydrateUserFromStorage,
  normalizeRole,
  normalizeDatasetResults,
  resolveAccessState,
} from "../../app/expert-data-management/ExpertDataManagementPage";

const mockPush = jest.fn();
const mockReplace = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
  }),
}));

const mockUseAuth = jest.fn();

jest.mock("../../app/auth/hooks/useAuth", () => ({
  useAuth: () => mockUseAuth(),
}));

jest.mock("../../app/components/Navbar", () => () => (
  <div data-testid="navbar">Navbar</div>
));
jest.mock("../../app/components/Footer", () => () => (
  <div data-testid="footer">Footer</div>
));
jest.mock("../../app/components/AccessDenied2", () => () => (
  <div data-testid="access-denied">Access denied</div>
));

const responseWithRows = (rows: any[]) =>
  Promise.resolve({
    ok: true,
    json: async () => ({ results: rows }),
  });

describe("ExpertDataManagementPage", () => {
  beforeEach(() => {
    mockPush.mockReset();
    mockReplace.mockReset();
    mockUseAuth.mockReset();
    mockUseAuth.mockReturnValue({ user: { role: "EXP_USER" } });
    window.localStorage.clear();
    document.cookie = "access_token=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
    (global as any).fetch = jest.fn(() => responseWithRows([]));
    (global as any).confirm = jest.fn(() => true);
    (global as any).alert = jest.fn();
  });

  test("redirects to login when no user and nothing stored", async () => {
    mockUseAuth.mockReturnValue({ user: null });

    render(<ExpertDataManagementPage />);

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith(
        "/login?next=%2Fexpert-data-management"
      );
    });
    expect(screen.getByText(/Memeriksa akses/i)).toBeInTheDocument();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  test("leverages stored user fallback to grant access", async () => {
    mockUseAuth.mockReturnValue({ user: null });
    window.localStorage.setItem(
      "user",
      JSON.stringify({ role: "exp_user", access_token: "stored-token" })
    );

    (global as any).fetch = jest
      .fn()
      .mockReturnValueOnce(
        responseWithRows([
          {
            data_id: "BATCH-1",
            file_name: "file-a.csv",
            last_edited: "2025-01-01",
            submitted_by: "ALPHA",
          },
        ])
      );

    render(<ExpertDataManagementPage />);

    expect(await screen.findByText("BATCH-1")).toBeInTheDocument();
    expect(mockReplace).not.toHaveBeenCalled();

    const call = (global as any).fetch.mock.calls[0];
    expect(call[1].headers["Authorization"]).toBe("Bearer stored-token");
  });

  test("shows access denied for unsupported role", async () => {
    mockUseAuth.mockReturnValue({ user: { role: "CURATOR" } });

    render(<ExpertDataManagementPage />);

    expect(await screen.findByTestId("access-denied")).toBeInTheDocument();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  test("renders fetched rows, supports filtering, and navigates to view page", async () => {
    window.localStorage.setItem(
      "user",
      JSON.stringify({ role: "EXP_USER", access_token: "jwt-123" })
    );

    (global as any).fetch = jest
      .fn()
      .mockReturnValueOnce(
        responseWithRows([
          {
            data_id: "ID1",
            file_name: "Report_Jakarta.xlsx",
            last_edited: "2025-09-01 09:23:45",
            submitted_by: "EXPERTA",
          },
          {
            data_id: "ID2",
            file_name: "Survey_Bandung.csv",
            last_edited: "2025-09-27 15:33:37",
            submitted_by: "EXPERTB",
          },
        ])
      );

    const user = userEvent.setup();
    render(<ExpertDataManagementPage />);

    expect(await screen.findByText("Report_Jakarta.xlsx")).toBeInTheDocument();
    const input = screen.getByPlaceholderText(/Cari berdasarkan/i);
    await user.type(input, "ID2");
    expect(await screen.findByText("ID2")).toBeInTheDocument();
    expect(screen.queryByText("ID1")).not.toBeInTheDocument();

    const clearBtn = await screen.findByRole("button", { name: /clear/i });
    await user.click(clearBtn);
    expect(input).toHaveValue("");
    expect(await screen.findByText("ID1")).toBeInTheDocument();

    const viewBtn = screen.getAllByRole("button", { name: "VIEW" })[0];
    await user.click(viewBtn);

    expect(mockPush).toHaveBeenCalledTimes(1);
    expect(mockPush.mock.calls[0][0]).toMatch(
      /expert-data-management\/view\?id=ID1/
    );
  });

  test("initialRows and initialQuery props skip fetch and expose clear/view handlers", async () => {
    const user = userEvent.setup();
    mockUseAuth.mockReturnValue({ user: { role: "EXP_USER" } });
    (global as any).fetch = jest.fn();

    render(
      <ExpertDataManagementPage
        initialRows={[
          {
            data_id: "STATIC",
            file_name: "Prefilled.csv",
            last_edited: "2025-05-05",
            submitted_by: "STATIC",
          },
        ]}
        initialQuery="prefill"
      />
    );

    expect(global.fetch).not.toHaveBeenCalled();

    const clearBtn = screen.getByRole("button", { name: /clear/i });
    await user.click(clearBtn);
    expect(screen.queryByRole("button", { name: /clear/i })).toBeNull();

    await user.click(screen.getByRole("button", { name: "VIEW" }));
    expect(mockPush).toHaveBeenCalledWith(
      expect.stringContaining("id=STATIC")
    );
  });

  test("handles dataset fetch failure", async () => {
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    (global as any).fetch = jest.fn().mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({}),
    });

    render(<ExpertDataManagementPage />);

    expect(
      await screen.findByText("Failed to load datasets.")
    ).toBeInTheDocument();
    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  test("fetch normalizes payloads when results is not an array", async () => {
    mockUseAuth.mockReturnValue({
      user: { role: "EXP_USER" },
    });

    (global as any).fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ results: {} }),
    });

    render(<ExpertDataManagementPage />);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });
    expect(screen.getByText("No data.")).toBeInTheDocument();
  });

  test("DELETE removes the row when API succeeds", async () => {
    window.localStorage.setItem(
      "user",
      JSON.stringify({ role: "EXP_USER", access_token: "jwt-del" })
    );

    (global as any).fetch = jest
      .fn()
      .mockReturnValueOnce(
        responseWithRows([
          {
            data_id: "DEL-1",
            file_name: "DeleteMe.csv",
            last_edited: "2025-01-01",
            submitted_by: "EXPERTA",
          },
        ])
      )
      .mockResolvedValueOnce({
        status: 204,
        text: async () => "",
      });

    const user = userEvent.setup();
    render(<ExpertDataManagementPage />);
    expect(await screen.findByText("DEL-1")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "DELETE" }));
    await waitFor(() => expect(screen.queryByText("DEL-1")).toBeNull());
    expect(global.fetch).toHaveBeenCalledTimes(2);
    expect(global.alert).not.toHaveBeenCalled();
  });

  test("DELETE surfaces server errors", async () => {
    (global as any).fetch = jest
      .fn()
      .mockReturnValueOnce(
        responseWithRows([
          {
            data_id: "DEL-2",
            file_name: "DeleteFail.csv",
            last_edited: "2025-01-02",
            submitted_by: "EXPERTB",
          },
        ])
      )
      .mockResolvedValueOnce({
        status: 500,
        text: async () => {
          throw new Error("boom");
        },
      });

    const user = userEvent.setup();
    render(<ExpertDataManagementPage />);
    expect(await screen.findByText("DEL-2")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "DELETE" }));
    await waitFor(() =>
      expect(global.alert).toHaveBeenCalledWith(
        "Failed to delete batch (status 500)."
      )
    );
  });

  test("DELETE handles network exception", async () => {
    (global as any).fetch = jest
      .fn()
      .mockReturnValueOnce(
        responseWithRows([
          {
            data_id: "DEL-3",
            file_name: "DeleteNetwork.csv",
            last_edited: "2025-01-03",
            submitted_by: "EXPERTC",
          },
        ])
      )
      .mockRejectedValueOnce(new Error("network down"));

    const user = userEvent.setup();
    render(<ExpertDataManagementPage />);
    expect(await screen.findByText("DEL-3")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "DELETE" }));
    await waitFor(() =>
      expect(global.alert).toHaveBeenCalledWith("Delete failed (network).")
    );
  });

  test("DELETE short-circuits when batch id is missing", async () => {
    (global as any).fetch = jest
      .fn()
      .mockReturnValueOnce(
        responseWithRows([
          {
            data_id: "",
            file_name: "NoId.csv",
            last_edited: "2025-03-15",
            submitted_by: "EXP",
          },
        ])
      );

    const user = userEvent.setup();
    render(<ExpertDataManagementPage />);
    expect(await screen.findByText("NoId.csv")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "DELETE" }));
    expect(global.confirm).not.toHaveBeenCalled();
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  test("DELETE aborts when user cancels confirmation", async () => {
    const originalConfirm = global.confirm;
    const confirmMock = jest.fn(() => false);
    // @ts-ignore
    global.confirm = confirmMock;

    mockUseAuth.mockReturnValue({ user: { role: "EXP_USER" } });
    (global as any).fetch = jest.fn();

    const user = userEvent.setup();
    const sampleRows = [
      {
        data_id: "ID_CANCEL",
        file_name: "Cancel.xlsx",
        last_edited: "2025-03-15",
        submitted_by: "CURATOR",
      },
    ];

    render(<ExpertDataManagementPage initialRows={sampleRows} />);

    await user.click(screen.getByRole("button", { name: "DELETE" }));
    expect(confirmMock).toHaveBeenCalled();
    expect(global.fetch).not.toHaveBeenCalled();

    global.confirm = originalConfirm;
  });
});

describe("token helpers", () => {
  beforeEach(() => {
    window.localStorage.clear();
    document.cookie = "access_token=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
  });

  test("getToken returns null when JSON parse fails", () => {
    window.localStorage.setItem("user", "{ invalid");
    expect(getToken()).toBeNull();
  });

  test("getToken picks access_token and token fallbacks", () => {
    window.localStorage.setItem("access_token", "plain-access");
    expect(getToken()).toBe("plain-access");

    window.localStorage.clear();
    window.localStorage.setItem("token", "legacy-token");
    expect(getToken()).toBe("legacy-token");

    window.localStorage.clear();
    window.localStorage.setItem(
      "user",
      JSON.stringify({ token: "user-token" })
    );
    expect(getToken()).toBe("user-token");
  });

  test("getToken prefers embedded access_token when available", () => {
    window.localStorage.clear();
    window.localStorage.setItem(
      "user",
      JSON.stringify({ access_token: "user-access" })
    );
    expect(getToken()).toBe("user-access");
  });

  test("getToken returns null when stored user lacks tokens", () => {
    window.localStorage.clear();
    window.localStorage.setItem("user", JSON.stringify({}));
    expect(getToken()).toBeNull();
  });

  test("getTokenForDelete prefers embedded user token then fallbacks then cookie", () => {
    window.localStorage.setItem(
      "user",
      JSON.stringify({ access_token: "from-user" })
    );
    expect(getTokenForDelete()).toBe("from-user");

    window.localStorage.setItem(
      "user",
      JSON.stringify({ token: "from-user-token" })
    );
    expect(getTokenForDelete()).toBe("from-user-token");

    window.localStorage.setItem("user", JSON.stringify({}));
    window.localStorage.setItem("jwt", "jwt-token");
    expect(getTokenForDelete()).toBe("jwt-token");

    window.localStorage.clear();
    document.cookie = "access_token=cookie-token";
    expect(getTokenForDelete()).toBe("cookie-token");
  });

  test("getTokenForDelete returns null when nothing available", () => {
    expect(getTokenForDelete()).toBeNull();
  });

  test("getTokenForDelete returns null when window is undefined", () => {
    const originalWindow = global.window;
    // @ts-ignore
    delete (global as any).window;
    expect(getTokenForDelete()).toBeNull();
    (global as any).window = originalWindow;
  });

  test("normalizeRole trims and uppercases safely", () => {
    expect(normalizeRole(" exp_user ")).toBe("EXP_USER");
    expect(normalizeRole(undefined)).toBe("");
  });

  test("hydrateUserFromStorage returns provided user or stored fallback", () => {
    const existing = { role: "EXP_USER" } as any;
    expect(hydrateUserFromStorage(existing)).toBe(existing);

    window.localStorage.setItem(
      "user",
      JSON.stringify({ role: "EXP_USER", name: "Fallback" })
    );
    const hydrated = hydrateUserFromStorage(null);
    expect(hydrated).toMatchObject({ role: "EXP_USER", name: "Fallback" });
    window.localStorage.clear();
  });

  test("hydrateUserFromStorage returns null when window is undefined", () => {
    const originalWindow = global.window;
    // @ts-ignore
    delete (global as any).window;
    expect(hydrateUserFromStorage(null)).toBeNull();
    (global as any).window = originalWindow;
  });

  test("filterRowsByQuery filters by case-insensitive match", () => {
    const rows: any[] = [
      { data_id: "ID1", file_name: "Report.xlsx", last_edited: "2025", submitted_by: "ALPHA" },
      { data_id: "ID2", file_name: "Summary.csv", last_edited: "2024", submitted_by: "BETA" },
    ];
    expect(filterRowsByQuery(rows, "")).toBe(rows);
    const filtered = filterRowsByQuery(rows, "summary");
    expect(filtered).toHaveLength(1);
    expect(filtered[0].data_id).toBe("ID2");
  });

  test("getEmptyStateMessage handles matching and default text", () => {
    expect(getEmptyStateMessage("   ")).toBe("No data.");
    expect(getEmptyStateMessage("something")).toBe("No matching data.");
  });

  test("normalizeDatasetResults handles malformed payloads", () => {
    const rows = [{ data_id: "ID1" } as any];
    expect(normalizeDatasetResults({ results: rows })).toBe(rows);
    expect(normalizeDatasetResults({ results: "oops" as any })).toEqual([]);
  });

  test("resolveAccessState covers each phase", () => {
    expect(resolveAccessState(null, true)).toBe("loading");
    expect(resolveAccessState(null, false)).toBe("redirect");
    expect(resolveAccessState({ role: "ADMIN" } as any, false)).toBe("forbidden");
    expect(resolveAccessState({ role: "EXP_USER" } as any, false)).toBe("granted");
  });

  test("buildViewHref composes deterministic query string", () => {
    const href = buildViewHref(
      {
        data_id: "X1",
        file_name: "Example.xlsx",
        last_edited: "2025-09-07",
        submitted_by: "FOO",
      },
      "https://origin.test"
    );

    expect(href).toBe(
      "/expert-data-management/view?id=X1&fileName=Example.xlsx&lastEdited=2025-09-07&submittedBy=FOO"
    );
  });
});

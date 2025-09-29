import React from "react";
import { render, screen, waitFor, within, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Page from "../../app/admin-user-log-menu/page";
import { fetchUserLogs } from "../../app/admin-user-log-menu/page";
import * as PageModule from "../../app/admin-user-log-menu/page";

jest.mock("../../app/components/Navbar", () => () => <div data-testid="navbar" />);

jest.mock("react-datepicker", () => {
  // eslint-disable-next-line react/display-name
  return (props: any) => (
    <input
      data-testid="mock-datepicker"
      aria-label={props.placeholderText || "datepicker"}
      value={props.selected ? new Date(props.selected).toISOString() : ""}
      onChange={(e) => props.onChange?.(new Date(e.target.value))}
    />
  );
});

afterEach(() => {
  jest.restoreAllMocks();
});

const mockData = {
  data: Array.from({ length: 10 }, (_, i) => ({
    id: i + 1,
    username: `user${i + 1}`,
    email: `user${i + 1}@example.com`,
    last_login: i % 2 === 0 ? "2025-01-01T00:00:00Z" : null,
  })),
  page: 1,
  pageSize: 10,
  total: 25,
};

beforeEach(() => {
  global.fetch = jest.fn(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve(mockData),
    })
  );
});

async function renderPage() {
  const ui = render(<Page />);
  await waitFor(() => expect(screen.queryByText(/Loading…/i)).not.toBeInTheDocument(), {
    timeout: 3000,
  });
  return ui;
}

describe("Admin User Log Page", () => {
  test("renders navbar and initial table with pagination meta", async () => {
    await renderPage();
    expect(screen.getByTestId("navbar")).toBeInTheDocument();
    expect(screen.getByText(/Menampilkan/i)).toHaveTextContent("Menampilkan 10 dari 25");
    expect(screen.getByText(/1 \/ 3/)).toBeInTheDocument();
    ["Username", "Email", "Date", "Detail", "Action"].forEach((h) =>
      expect(screen.getByText(h)).toBeInTheDocument()
    );
  });

  test("status badges map to the expected classes", async () => {
    await renderPage();
    const success = screen.getAllByText("Login success")[0];
    const changed = screen.getAllByText("Change Role")[0];
    const failed = screen.getAllByText("Login Failed")[0];
    expect(success.className).toMatch(/text-green-600/);
    expect(changed.className).toMatch(/text-yellow-500/);
    expect(failed.className).toMatch(/text-red-700/);
  });

  test("open modal (>), close via Escape, then via buttons", async () => {
    await renderPage();
    const openButtons = screen.getAllByRole("button", { name: /lihat detail/i });
    await userEvent.click(openButtons[0]);
    expect(await screen.findByText(/Detail Aktivitas/i)).toBeInTheDocument();

    fireEvent.keyDown(window, { key: "Escape" });
    await waitFor(() => expect(screen.queryByText(/Detail Aktivitas/i)).not.toBeInTheDocument());

    await userEvent.click(openButtons[0]);
    expect(await screen.findByText(/Detail Aktivitas/i)).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /Keluar/i }));
    await waitFor(() => expect(screen.queryByText(/Detail Aktivitas/i)).not.toBeInTheDocument());

    await userEvent.click(openButtons[0]);
    expect(await screen.findByText(/Detail Aktivitas/i)).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /Simpan/i }));
    await waitFor(() => expect(screen.queryByText(/Detail Aktivitas/i)).not.toBeInTheDocument());
  });

  test("search filter narrows rows and empty state for unmatched query", async () => {
    await renderPage();
    const search = screen.getByPlaceholderText(/Cari user/i);
    await userEvent.type(search, "user2");

    const list = await screen.findByRole("list");
    const items = within(list).getAllByRole("listitem");
    expect(items.length).toBeGreaterThan(0);

    await userEvent.clear(search);
    await userEvent.type(search, "zzzz-not-found");
    expect(await screen.findByText(/Tidak ada data/i)).toBeInTheDocument();
  });

  test("date range filter applies (broad range includes rows)", async () => {
    await renderPage();
    const pickers = screen.getAllByTestId("mock-datepicker");
    const now = Date.now();

    const startISO = new Date(now - 24 * 36e5).toISOString();
    const endISO = new Date(now + 1 * 36e5).toISOString();

    fireEvent.change(pickers[0], { target: { value: startISO } });
    fireEvent.change(pickers[1], { target: { value: endISO } });

    const list = await screen.findByRole("list");
    const items = within(list).getAllByRole("listitem");
    expect(items.length).toBe(10);
  });

  test('"Terapkan Filter" resets search & dates and reloads rows', async () => {
    await renderPage();
    const search = screen.getByPlaceholderText(/Cari user/i);
    await userEvent.type(search, "no-record-pls");
    expect(await screen.findByText(/Tidak ada data/i)).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: /Terapkan Filter/i }));

    await waitFor(() => {
      expect(screen.queryByText(/Tidak ada data/i)).not.toBeInTheDocument();
    });
    expect(screen.getByText(/Menampilkan/)).toHaveTextContent("Menampilkan 10 dari 25");
    expect((search as HTMLInputElement).value).toBe("");
  });

  test("pagination Next/Prev updates indicator and disables at bounds", async () => {
    await renderPage();
    const next = screen.getByRole("button", { name: /Next/i });
    const prev = screen.getByRole("button", { name: /Prev/i });

    expect(prev).toBeDisabled();
    expect(next).not.toBeDisabled();

    await userEvent.click(next);
    expect(await screen.findByText(/2 \/ 3/)).toBeInTheDocument();

    await userEvent.click(next);
    expect(await screen.findByText(/3 \/ 3/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Next/i })).toBeDisabled();

    await userEvent.click(screen.getByRole("button", { name: /Prev/i }));
    expect(await screen.findByText(/2 \/ 3/)).toBeInTheDocument();
  });

  test("date cell matches formatted pattern (fmtDate)", async () => {
    await renderPage();
    const dateCell = screen.getAllByText(/\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/)[0];
    expect(dateCell).toBeInTheDocument();
  });

  test("modal closes when clicking the backdrop overlay", async () => {
    await renderPage();
    const open = screen.getAllByRole("button", { name: /lihat detail/i })[0];
    await userEvent.click(open);
    const dialog = await screen.findByRole("dialog");
    const backdrop = dialog.parentElement as HTMLElement;
    await userEvent.click(backdrop);
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });

  test('modal closes when clicking the "✕" button (aria-label="Tutup")', async () => {
    await renderPage();
    const open = screen.getAllByRole("button", { name: /lihat detail/i })[0];
    await userEvent.click(open);
    const closeX = await screen.findByRole("button", { name: "Tutup" });
    await userEvent.click(closeX);
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });

  test("fetchUserLogs uses default fallbacks when params are missing", async () => {
    const res = await fetchUserLogs({} as any);
    expect(res.page).toBe(1);       // 'params.page ?? 1'
    expect(res.pageSize).toBe(10);  // 'params.pageSize ?? 10'
    expect(res.data.length).toBe(10);
  });

  test('modal shows "-" when note is missing', async () => {
    await renderPage();
    const openBtns = screen.getAllByRole("button", { name: /lihat detail/i });
    await userEvent.click(openBtns[1]); 
    expect(await screen.findByText("-")).toBeInTheDocument();
  });
  
  
});

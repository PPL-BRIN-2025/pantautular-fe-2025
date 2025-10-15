import React from "react";
import { render, screen, waitFor, within, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Page from "../../app/admin-user-log-menu/page";

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

const mockLogs = Array.from({ length: 25 }, (_, index) => {
  const minutes = index * 5;
  return {
    id: index + 1,
    username: `user${index + 1}`,
    email: `user${index + 1}@example.com`,
    timestamp: new Date(2025, 0, 1, 12, minutes).toISOString(),
    action: index % 2 === 0 ? "LOGIN" : "LOGOUT",
    detail: `Detail aktivitas ${index + 1}`,
    note: index % 3 === 0 ? `Catatan ${index + 1}` : null,
  };
});

const mockResponse = { count: mockLogs.length, logs: mockLogs };

beforeEach(() => {
  jest.resetAllMocks();
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => mockResponse,
  }) as unknown as typeof fetch;
});

afterEach(() => {
  jest.restoreAllMocks();
});

async function renderPage() {
  const ui = render(<Page />);
  await waitFor(() => expect(screen.queryByText(/Loading…/i)).not.toBeInTheDocument());
  return ui;
}

describe("Admin User Log Page", () => {
  test("renders initial table with pagination meta", async () => {
    await renderPage();

    expect(screen.queryByTestId("navbar")).not.toBeInTheDocument();
    expect(screen.getByText(/Menampilkan/i)).toHaveTextContent("Menampilkan 10 dari 25");
    expect(screen.getByText("1 / 3")).toBeInTheDocument();

    ["Username", "Email", "Timestamp", "Action", "Detail"].forEach((header) => {
      expect(screen.getByText(header)).toBeInTheDocument();
    });

  // First row should contain the most recent log after sorting desc
  const list = screen.getByRole("list");
  const firstRow = within(list).getAllByRole("listitem")[0];
  expect(firstRow).toHaveTextContent(/user25/i);
  expect(firstRow).toHaveTextContent(/Detail aktivitas 25/);
  });

  test("search filter narrows rows and shows empty state when unmatched", async () => {
    await renderPage();

    const search = screen.getByPlaceholderText(/Cari username/i);
    await userEvent.type(search, "user17");

    await waitFor(() => {
      expect(screen.getByText(/Menampilkan/).textContent).toContain("Menampilkan 1 dari 1");
    });
    const filteredList = screen.getByRole("list");
    expect(within(filteredList).getAllByRole("listitem")[0]).toHaveTextContent("user17");

    await userEvent.clear(search);
    await userEvent.type(search, "tidak-ada");

    expect(await screen.findByText(/Tidak ada data/i)).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText(/Menampilkan/).textContent).toContain("Menampilkan 0 dari 0");
    });
  });

  test("date range filter uses timestamp field", async () => {
    await renderPage();

    const [startPicker, endPicker] = screen.getAllByTestId("mock-datepicker");
    const latest = mockLogs[mockLogs.length - 1].timestamp;
    const earlier = mockLogs[mockLogs.length - 5].timestamp;

    fireEvent.change(startPicker, { target: { value: earlier } });
    fireEvent.change(endPicker, { target: { value: latest } });

    await waitFor(() => {
      expect(screen.getByText(/Menampilkan/).textContent).toContain("Menampilkan 5 dari 5");
    });
  });

  test("pagination updates indicator and disables at bounds", async () => {
    await renderPage();

    const next = screen.getByRole("button", { name: /Next/i });
    const prev = screen.getByRole("button", { name: /Prev/i });

    expect(prev).toBeDisabled();
    expect(next).not.toBeDisabled();

    await userEvent.click(next);
    expect(await screen.findByText("2 / 3")).toBeInTheDocument();

    await userEvent.click(next);
    expect(await screen.findByText("3 / 3")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Next/i })).toBeDisabled();

    await userEvent.click(screen.getByRole("button", { name: /Prev/i }));
    expect(await screen.findByText("2 / 3")).toBeInTheDocument();
  });
});

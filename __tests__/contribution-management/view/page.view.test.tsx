import "@testing-library/jest-dom";
import { render, screen, fireEvent } from "@testing-library/react";

import ContributionViewPage from "../../../app/contribution-management/view/page";

// ---- mocks ----

jest.mock("../../../app/components/Navbar", () => () => (
  <div data-testid="navbar" />
));
jest.mock("../../../app/components/Footer", () => () => (
  <div data-testid="footer" />
));

// mock next/navigation: useSearchParams + useRouter
const mockBack = jest.fn();
const mockUseSearchParams = jest.fn();

jest.mock("next/navigation", () => ({
  // called inside component
  useSearchParams: () => mockUseSearchParams(),
  useRouter: () => ({
    back: mockBack,
  }),
}));

describe("ContributionViewPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("shows not-found state when id query param is missing", () => {
    // get() always returns null -> id === ""
    mockUseSearchParams.mockReturnValue({
      get: () => null,
    });

    render(<ContributionViewPage />);

    // still shows generic not-found message
    expect(
      screen.getByText(/Kontribusi dengan ID/i)
    ).toBeInTheDocument();
    // back button works
    const backBtn = screen.getByRole("button", { name: /kembali/i });
    fireEvent.click(backBtn);
    expect(mockBack).toHaveBeenCalled();
  });

  test("shows not-found state when contribution id is unknown", () => {
    mockUseSearchParams.mockReturnValue({
      get: (key: string) => (key === "id" ? "UNKNOWN" : null),
    });

    render(<ContributionViewPage />);

    expect(
      screen.getByText(/Kontribusi dengan ID/i)
    ).toBeInTheDocument();
    expect(screen.getByText("UNKNOWN")).toBeInTheDocument();

    const backBtn = screen.getByRole("button", { name: /kembali/i });
    fireEvent.click(backBtn);
    expect(mockBack).toHaveBeenCalled();
  });

  test("renders detail view for a valid contribution (ID1)", () => {
    mockUseSearchParams.mockReturnValue({
      get: (key: string) => (key === "id" ? "ID1" : null),
    });

    render(<ContributionViewPage />);

    // title in header
    expect(screen.getByText("Bla Bla Bla")).toBeInTheDocument();

    // location & date
    expect(
      screen.getByText(/Jakarta, 2025-11-01/)
    ).toBeInTheDocument();

    // status badge
    expect(
      screen.queryByText(/Status: APPPROVED/i)
    ).not.toBeInTheDocument();
    expect(screen.getByText(/Status: APPROVED/i)).toBeInTheDocument();

    // detail text snippet
    expect(
      screen.getByText(/Laporan kasus penyakit menular/i)
    ).toBeInTheDocument();

    // navbar + footer exist (sanity)
    expect(screen.getByTestId("navbar")).toBeInTheDocument();
    expect(screen.getByTestId("footer")).toBeInTheDocument();
  });

  test("header close (X) button goes back to previous page", () => {
    mockUseSearchParams.mockReturnValue({
      get: (key: string) => (key === "id" ? "ID1" : null),
    });

    render(<ContributionViewPage />);

    const closeBtn = screen.getByLabelText(/close/i);
    fireEvent.click(closeBtn);

    expect(mockBack).toHaveBeenCalledTimes(1);
  });

  test("can reject a contribution with a note and updates status + flash", () => {
    mockUseSearchParams.mockReturnValue({
      get: (key: string) => (key === "id" ? "ID3" : null),
    });

    render(<ContributionViewPage />);

    // initial status: WAITING FOR APPROVAL
    expect(
      screen.getByText(/Status: WAITING FOR APPROVAL/i)
    ).toBeInTheDocument();

    // open reject modal
    fireEvent.click(screen.getByRole("button", { name: /reject/i }));

    const textarea = screen.getByPlaceholderText(
      /Tuliskan alasan penolakan/i
    );
    fireEvent.change(textarea, {
      target: { value: "Data kurang lengkap" },
    });

    fireEvent.click(
      screen.getByRole("button", { name: /Reject Data/i })
    );

    // status updated
    expect(
      screen.getByText(/Status: REJECTED/i)
    ).toBeInTheDocument();

    // flash message appears with note
    expect(
      screen.getByText(/Kontribusi ditolak dengan catatan/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Data kurang lengkap/)
    ).toBeInTheDocument();
  });

  test("can reject a contribution without note and shows default flash", () => {
    mockUseSearchParams.mockReturnValue({
      get: (key: string) => (key === "id" ? "ID3" : null),
    });

    render(<ContributionViewPage />);

    // open reject modal
    fireEvent.click(screen.getByRole("button", { name: /reject/i }));

    fireEvent.click(
      screen.getByRole("button", { name: /Reject Data/i })
    );

    // status updated
    expect(
      screen.getByText(/Status: REJECTED/i)
    ).toBeInTheDocument();

    // flash default (tanpa catatan)
    expect(
      screen.getByText("Kontribusi ditolak.")
    ).toBeInTheDocument();
  });

  test("can close reject modal using the X button", () => {
    mockUseSearchParams.mockReturnValue({
      get: (key: string) => (key === "id" ? "ID3" : null),
    });

    render(<ContributionViewPage />);

    fireEvent.click(screen.getByRole("button", { name: /reject/i }));
    expect(
      screen.getByText(/Reject Data Confirmation/i)
    ).toBeInTheDocument();

    const xs = screen.getAllByRole("button", { name: "×" });
    fireEvent.click(xs[xs.length - 1]);

    expect(
      screen.queryByText(/Reject Data Confirmation/i)
    ).not.toBeInTheDocument();
  });

  test("can approve a contribution and shows success flash", () => {
    mockUseSearchParams.mockReturnValue({
      get: (key: string) => (key === "id" ? "ID3" : null),
    });

    render(<ContributionViewPage />);

    // open approve modal
    fireEvent.click(screen.getByRole("button", { name: /approve/i }));

    // confirm approve
    fireEvent.click(screen.getByRole("button", { name: /yes/i }));

    // status updated
    expect(
      screen.getByText(/Status: APPROVED/i)
    ).toBeInTheDocument();

    // success flash
    expect(
      screen.getByText(/Kontribusi berhasil disetujui/i)
    ).toBeInTheDocument();
  });

  test("can close approve modal using the X button without approving", () => {
    mockUseSearchParams.mockReturnValue({
      get: (key: string) => (key === "id" ? "ID3" : null),
    });

    render(<ContributionViewPage />);

    // modal approve
    fireEvent.click(screen.getByRole("button", { name: /approve/i }));
    expect(
      screen.getByText(/Approve Data\?/i)
    ).toBeInTheDocument();
    const xs = screen.getAllByRole("button", { name: "×" });
    fireEvent.click(xs[xs.length - 1]);

    expect(
      screen.queryByText(/Approve Data\?/i)
    ).not.toBeInTheDocument();
    expect(
      screen.getByText(/Status: WAITING FOR APPROVAL/i)
    ).toBeInTheDocument();
  });

  test("back button in header triggers router.back()", () => {
    mockUseSearchParams.mockReturnValue({
      get: (key: string) => (key === "id" ? "ID1" : null),
    });

    render(<ContributionViewPage />);

    const backHeaderBtn = screen.getByRole("button", {
      name: /kembali ke daftar kontribusi/i,
    });

    fireEvent.click(backHeaderBtn);

    expect(mockBack).toHaveBeenCalled();
  });
});

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import NewsPage from "../page";
import type { NewsListResponse } from "../domain/types";
import { NEWS_PAGE_SIZE } from "../constants";

const mockUseNewsList = jest.fn();

jest.mock("../hooks/useNewsList", () => ({
  useNewsList: (params: unknown) => mockUseNewsList(params),
}));

jest.mock("../../components/Navbar", () => () => <nav data-testid="navbar-mock" />);
jest.mock("../../components/Footer", () => () => <footer data-testid="footer-mock" />);

jest.mock("next/image", () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const MockImage = ({ src, alt, fill: _fill, priority: _priority, ...rest }: any) => (
    <img src={src} alt={alt} data-testid="next-image" {...rest} />
  );
  return MockImage;
});

jest.mock("next/link", () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const MockLink = ({ href, children, ...rest }: any) => (
    <a href={typeof href === "string" ? href : href?.pathname} {...rest}>
      {children}
    </a>
  );
  return MockLink;
});

const baseResponse: NewsListResponse = {
  data: [
    {
      id: "1",
      title: "First news",
      summary: "Summary",
      source_name: "PantauTular",
      source_url: "https://example.com",
      thumbnail_url: null,
      published_at: "2024-01-01T00:00:00Z",
      is_curated: true,
      curated_tags: ["urgent"],
    },
  ],
  page: 1,
  pageSize: NEWS_PAGE_SIZE,
  total: 20,
};

describe("NewsPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseNewsList.mockReturnValue({
      data: baseResponse,
      isLoading: false,
      isError: false,
      error: null,
      refetch: jest.fn(),
    });
  });

  it("renders skeleton when loading", () => {
    mockUseNewsList.mockReturnValue({
      data: { ...baseResponse, data: [] },
      isLoading: true,
      isError: false,
      error: null,
      refetch: jest.fn(),
    });
    render(<NewsPage />);
    expect(screen.getAllByTestId("news-skeleton-card")).toHaveLength(NEWS_PAGE_SIZE);
  });

  it("renders article cards on success", () => {
    render(<NewsPage />);
    expect(screen.getByText("First news")).toBeInTheDocument();
  });

  it("renders empty state when hook returns no data object", () => {
    mockUseNewsList.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: false,
      error: null,
      refetch: jest.fn(),
    });
    render(<NewsPage />);
    expect(screen.getByText(/no news found/i)).toBeInTheDocument();
  });

  it("shows error state", () => {
    mockUseNewsList.mockReturnValue({
      data: { ...baseResponse, data: [] },
      isLoading: false,
      isError: true,
      error: new Error("boom"),
      refetch: jest.fn(),
    });
    render(<NewsPage />);
    expect(screen.getByText(/failed to load news/i)).toBeInTheDocument();
  });

  it("passes the default pagination params to the hook", () => {
    render(<NewsPage />);
    expect(mockUseNewsList).toHaveBeenCalledWith(
      expect.objectContaining({ page: 1, pageSize: NEWS_PAGE_SIZE })
    );
  });

  it("changes page when pagination controls used", async () => {
    const user = userEvent.setup();
    render(<NewsPage />);
    await user.click(screen.getByRole("button", { name: /next/i }));
    const lastCall = mockUseNewsList.mock.calls.pop()?.[0] as Record<string, unknown>;
    expect(lastCall?.page).toBe(2);
  });
});

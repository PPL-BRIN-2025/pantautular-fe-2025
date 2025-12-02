import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import NewsList from "../components/NewsList";
import type { NewsArticle } from "../domain/types";
import { NEWS_PAGE_SIZE } from "../constants";

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
    <a href={typeof href === "string" ? href : href.pathname} {...rest}>
      {children}
    </a>
  );
  return MockLink;
});

const articles: NewsArticle[] = Array.from({ length: 3 }, (_, idx) => ({
  id: `news-${idx + 1}`,
  title: `News ${idx + 1}`,
  summary: "Summary",
  source_name: "PantauTular",
  source_url: "https://example.com",
  thumbnail_url: null,
  published_at: "2024-01-0" + (idx + 1),
  is_curated: idx === 0,
  curated_tags: idx === 0 ? ["urgent"] : [],
}));

describe("NewsList", () => {
  it("renders a card for each article", () => {
    render(
      <NewsList
        articles={articles}
        page={1}
        pageSize={NEWS_PAGE_SIZE}
        total={30}
        isLoading={false}
        isError={false}
      />
    );
    expect(screen.getAllByTestId("news-card")).toHaveLength(articles.length);
    const firstLink = screen.getAllByRole("link")[0];
    expect(firstLink).toHaveAttribute("href", "/news/news-1");
  });

  it("renders skeletons during loading", () => {
    render(<NewsList articles={[]} isLoading />);
    expect(screen.getAllByTestId("news-skeleton-card")).toHaveLength(NEWS_PAGE_SIZE);
  });

  it("renders empty state when there are no articles", () => {
    render(<NewsList articles={[]} isLoading={false} isError={false} />);
    expect(screen.getByText(/no news found/i)).toBeInTheDocument();
  });

  it("shows error state with retry button", async () => {
    const onRetry = jest.fn();
    const user = userEvent.setup();
    render(<NewsList articles={[]} isError onRetry={onRetry} />);
    await user.click(screen.getByRole("button", { name: /retry/i }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("invokes pagination callbacks", async () => {
    const user = userEvent.setup();
    const onPageChange = jest.fn();
    render(
      <NewsList
        articles={articles}
        isLoading={false}
        isError={false}
        page={1}
        pageSize={NEWS_PAGE_SIZE}
        total={40}
        onPageChange={onPageChange}
      />
    );

    await user.click(screen.getByRole("button", { name: /next/i }));
    expect(onPageChange).toHaveBeenCalledWith(2);
  });

  it("handles previous pagination button", async () => {
    const user = userEvent.setup();
    const onPageChange = jest.fn();
    render(
      <NewsList
        articles={articles}
        isLoading={false}
        isError={false}
        page={2}
        pageSize={NEWS_PAGE_SIZE}
        total={40}
        onPageChange={onPageChange}
      />
    );
    await user.click(screen.getByRole("button", { name: /previous/i }));
    expect(onPageChange).toHaveBeenCalledWith(1);
  });

  it("exposes responsive grid container", () => {
    render(<NewsList articles={articles} isLoading={false} />);
    const grid = screen.getByTestId("news-grid");
    expect(grid.className).toContain("grid");
    expect(grid.className).toContain("md:grid-cols-2");
  });

  it("falls back to single page when page size is invalid", () => {
    render(
      <NewsList
        articles={articles}
        isLoading={false}
        total={100}
        pageSize={0}
        page={1}
      />
    );
    expect(
      screen.getByText((content, element) => element?.textContent === "Page 1 of 1")
    ).toBeInTheDocument();
  });
});

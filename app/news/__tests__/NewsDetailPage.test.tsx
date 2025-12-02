import { render, screen } from "@testing-library/react";
import NewsDetailPage from "../[id]/page";
import type { NewsArticle } from "../domain/types";

const mockUseNewsDetail = jest.fn();

jest.mock("../hooks/useNewsDetail", () => ({
  useNewsDetail: (id: string) => mockUseNewsDetail(id),
}));

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

jest.mock("../../components/Navbar", () => () => <div data-testid="navbar">Navbar</div>);
jest.mock("../../components/Footer", () => () => <div data-testid="footer">Footer</div>);
jest.mock("../components/DefaultThumbnail", () => () => <div data-testid="thumb">Thumb</div>);
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), prefetch: jest.fn() }),
}));

const article: NewsArticle = {
  id: "1",
  title: "Detail title",
  summary: "Longer summary content",
  source_name: "PantauTular",
  source_url: "https://example.com",
  thumbnail_url: null,
  published_at: "2024-01-02T03:00:00Z",
  is_curated: true,
  curated_tags: ["tag-a", "tag-b"],
};

describe("NewsDetailPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseNewsDetail.mockReturnValue({
      data: article,
      isLoading: false,
      isError: false,
      error: null,
    });
  });

  it("renders skeleton when loading", () => {
    mockUseNewsDetail.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      error: null,
    });
    render(<NewsDetailPage params={{ id: "1" }} />);
    expect(screen.getByTestId("news-detail-skeleton")).toBeInTheDocument();
  });

  it("renders article detail content", () => {
    render(<NewsDetailPage params={{ id: "1" }} />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Detail title");
    expect(screen.getByText("Longer summary content")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /read at source/i })).toHaveAttribute("href", article.source_url);
  });

  it("renders not found state on error", () => {
    mockUseNewsDetail.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: new Error("boom"),
    });
    render(<NewsDetailPage params={{ id: "missing" }} />);
    expect(screen.getByText(/article not found/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /back to news/i })).toHaveAttribute("href", "/news");
  });

  it("shows unknown date when published_at invalid", () => {
    mockUseNewsDetail.mockReturnValue({
      data: { ...article, published_at: "invalid-date" },
      isLoading: false,
      isError: false,
      error: null,
    });
    render(<NewsDetailPage params={{ id: "1" }} />);
    expect(screen.getByText("Unknown date")).toBeInTheDocument();
  });
});

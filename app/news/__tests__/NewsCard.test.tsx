import { render, screen } from "@testing-library/react";
import NewsCard from "../components/NewsCard";
import type { NewsArticle } from "../domain/types";

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

const baseArticle: NewsArticle = {
  id: "card-1",
  title: "News card",
  summary: "Summary",
  source_name: "PantauTular",
  source_url: "https://example.com",
  thumbnail_url: null,
  published_at: "2024-01-01T00:00:00Z",
  is_curated: true,
  curated_tags: ["featured"],
};

describe("NewsCard", () => {
  it("renders unknown date fallback for invalid timestamps", () => {
    render(<NewsCard article={{ ...baseArticle, published_at: "invalid-date" }} />);
    expect(screen.getByText("Unknown date")).toBeInTheDocument();
  });

  it("renders tags for curated articles", () => {
    render(<NewsCard article={baseArticle} />);
    expect(screen.getByText("featured")).toBeInTheDocument();
  });
});

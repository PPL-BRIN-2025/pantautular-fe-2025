import { render, screen } from "@testing-library/react";
import NewsSkeleton from "../components/NewsSkeleton";
import NewsDetailSkeleton from "../components/NewsDetailSkeleton";
import { NEWS_PAGE_SIZE } from "../constants";

describe("NewsSkeleton", () => {
  it("renders the configured skeleton card count", () => {
    render(<NewsSkeleton />);
    const cards = screen.getAllByTestId("news-skeleton-card");
    expect(cards).toHaveLength(NEWS_PAGE_SIZE);
  });
});

describe("NewsDetailSkeleton", () => {
  it("renders the detail skeleton layout", () => {
    render(<NewsDetailSkeleton />);
    expect(screen.getByTestId("news-detail-skeleton")).toBeInTheDocument();
    expect(screen.getByTestId("news-detail-skeleton-title")).toBeInTheDocument();
    expect(screen.getAllByTestId("news-detail-skeleton-paragraph")).toHaveLength(3);
  });
});

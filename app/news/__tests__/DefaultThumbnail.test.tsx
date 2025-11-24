import { render, screen } from "@testing-library/react";
import DefaultThumbnail from "../components/DefaultThumbnail";

jest.mock("next/image", () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const MockImage = ({ src, alt, fill: _fill, priority: _priority, ...rest }: any) => (
    <img src={src} alt={alt} data-testid="next-image" {...rest} />
  );
  return MockImage;
});

describe("DefaultThumbnail", () => {
  it("renders provided src when available", () => {
    render(<DefaultThumbnail src="https://example.com/custom.png" alt="custom alt" />);
    const image = screen.getByTestId("next-image") as HTMLImageElement;
    expect(image).toHaveAttribute("src", "https://example.com/custom.png");
    expect(image).toHaveAttribute("alt", "custom alt");
  });

  it("falls back to default image when src missing", () => {
    render(<DefaultThumbnail src={null} alt="fallback alt" />);
    const image = screen.getByTestId("next-image") as HTMLImageElement;
    expect(image.getAttribute("src")).toContain("news-default");
    expect(image).toHaveAttribute("alt", "fallback alt");
  });
});

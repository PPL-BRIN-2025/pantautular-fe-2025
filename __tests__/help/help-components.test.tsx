import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";

jest.mock("next/image", () => (props: any) => (
  <img data-testid="next-image" {...props} />
));

const mockBackgroundCircle = jest.fn(() => <div data-testid="bg-circle" />);

jest.mock("../../app/components/BackgroundCircle", () => ({
  __esModule: true,
  default: (props: any) => mockBackgroundCircle(props),
}));

describe("Help components", () => {
  beforeEach(() => {
    mockBackgroundCircle.mockClear();
  });

  test("HelpSection renders title, description, and custom image", () => {
    const HelpSection = require("../../app/components/help/HelpSection").default;
    render(
      <HelpSection
        title="Langkah PantauTular"
        description="Ikuti panduan ringkas"
        imageSrc="/custom.png"
        imageAlt="Langkah detail"
      />
    );

    expect(screen.getByText("Langkah PantauTular")).toBeInTheDocument();
    expect(screen.getByText("Ikuti panduan ringkas")).toBeInTheDocument();

    expect(screen.getByAltText("Peta umum")).toBeInTheDocument();
    expect(screen.getByAltText("Langkah detail")).toHaveAttribute("src", "/custom.png");
    expect(screen.getByAltText("Detail kasus")).toBeInTheDocument();
  });

  test("HelpImage forwards props to next/image mock", () => {
    const HelpImage = require("../../app/components/help/HelpImage").default;
    render(<HelpImage src="/foo.png" alt="Example" />);
    const img = screen.getByTestId("next-image");
    expect(img).toHaveAttribute("alt", "Example");
    expect(img).toHaveAttribute("src", "/foo.png");
  });

  test("HelpFinalSection renders static copy and background circles", () => {
    const HelpFinalSection = require("../../app/components/help/HelpFinalSection").default;
    render(<HelpFinalSection />);

    expect(
      screen.getByText(/Setelah melakukan pencarian,/i)
    ).toBeInTheDocument();
    expect(mockBackgroundCircle).toHaveBeenCalledTimes(2);
    expect(mockBackgroundCircle).toHaveBeenCalledWith(
      expect.objectContaining({
        size: { width: "400px", height: "200px" },
        position: "left-1/10",
      })
    );
    expect(mockBackgroundCircle).toHaveBeenCalledWith(
      expect.objectContaining({
        size: { width: "400px", height: "100px" },
        position: "left-3/4",
      })
    );
  });
});

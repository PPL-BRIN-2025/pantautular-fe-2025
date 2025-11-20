import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";

jest.mock("next/image", () => (props: any) => (
  <img data-testid="next-image" {...props} />
));

const mockButtonBase = jest.fn(({ children, ...rest }: any) => (
  <button data-testid="button-base" {...rest}>
    {children}
  </button>
));

const mockButtonWithArrow = jest.fn(({ children, href }: any) => (
  <button data-testid="button-with-arrow" data-href={href}>
    {children}
  </button>
));

jest.mock("../../app/components/ButtonBase", () => ({
  __esModule: true,
  default: (props: any) => mockButtonBase(props),
}));

jest.mock("../../app/components/ButtonWithArrow", () => ({
  __esModule: true,
  default: (props: any) => mockButtonWithArrow(props),
}));

describe("Home landing sections", () => {
  beforeEach(() => {
    mockButtonBase.mockClear();
    mockButtonWithArrow.mockClear();
  });

  test("HeroSection renders headline and uses ButtonBase with /map", () => {
    const HeroSection = require("../../app/components/home/HeroSection").default;
    render(<HeroSection />);

    expect(
      screen.getByText("Selamat Datang di PantauTular!")
    ).toBeInTheDocument();
    expect(mockButtonBase).toHaveBeenCalledWith(
      expect.objectContaining({ href: "/map" })
    );
  });

  test("AboutSection renders CTA button with /about", () => {
    const AboutSection = require("../../app/components/home/AboutSection").default;
    render(<AboutSection />);

    expect(screen.getByText("Tentang Kami")).toBeInTheDocument();
    expect(mockButtonWithArrow).toHaveBeenCalledWith(
      expect.objectContaining({ href: "/about" })
    );
  });

  test("Home HelpSection renders CTA button with /help", () => {
    const HomeHelpSection = require("../../app/components/home/HelpSection").default;
    render(<HomeHelpSection />);
    expect(screen.getByText("Bantuan")).toBeInTheDocument();
    expect(mockButtonWithArrow).toHaveBeenCalledWith(
      expect.objectContaining({ href: "/help" })
    );
  });

  test("AdvantagesSection lists three feature cards", () => {
    const AdvantagesSection =
      require("../../app/components/home/AdvantagesSection").default;
    render(<AdvantagesSection />);
    expect(screen.getByText("Akses Mudah dan Cepat")).toBeInTheDocument();
    expect(screen.getByText("Data Akurat dan Terkini")).toBeInTheDocument();
    expect(screen.getByText("Pemantauan Efektif")).toBeInTheDocument();
  });

  test("MapGallery renders three gallery images", () => {
    const MapGallery = require("../../app/components/home/MapGallery").default;
    render(<MapGallery />);
    expect(screen.getByAltText("Peta Sebaran 1")).toBeInTheDocument();
    expect(screen.getByAltText("Peta Sebaran 2")).toBeInTheDocument();
    expect(screen.getByAltText("Peta Sebaran 3")).toBeInTheDocument();
  });

  test("WhyPantauTularSection provides intro copy", () => {
    const WhySection =
      require("../../app/components/home/WhyPantauTularSection").default;
    render(<WhySection />);
    expect(screen.getByText("Mengapa PantauTular?")).toBeInTheDocument();
    expect(
      screen.getByText(/memberikan beberapa keuntungan menarik/i)
    ).toBeInTheDocument();
  });
});

import React from "react";
import { act, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import Footer from "../../app/components/Footer";

class MockIntersectionObserver {
  callback: (entries: any[]) => void;
  constructor(callback: any) {
    this.callback = callback;
  }
  observe() {
    // immediately report sentinel is intersecting
    this.callback([{ isIntersecting: true }]);
  }
  disconnect() {}
}

class MockResizeObserver {
  cb: () => void;
  constructor(cb: any) {
    this.cb = cb;
  }
  observe() {
    this.cb();
  }
  disconnect() {}
}

describe("Footer", () => {
  beforeAll(() => {
    (global as any).IntersectionObserver = MockIntersectionObserver;
    (global as any).ResizeObserver = MockResizeObserver;
  });

  test("toggles visibility state and updates CSS variable", () => {
    render(<Footer />);
    const footer = screen.getByRole("contentinfo");
    expect(footer).toHaveAttribute("aria-hidden", "false");
    expect(document.documentElement.style.getPropertyValue("--pt-footer-h")).not.toBe("");

    // Drive the __setVisible escape hatch
    act(() => (Footer as any).__setVisible(false));
    expect(footer).toHaveAttribute("aria-hidden", "true");
    act(() => (Footer as any).__setVisible(true));
    expect(footer).toHaveAttribute("aria-hidden", "false");
  });
});

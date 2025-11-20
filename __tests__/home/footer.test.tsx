import { render, screen, act } from "@testing-library/react";
import "@testing-library/jest-dom";
import Footer from "../../app/components/Footer";

class MockObserver {
  callback: IntersectionObserverCallback;
  constructor(callback: IntersectionObserverCallback) {
    this.callback = callback;
  }
  observe() {
    this.callback([{ isIntersecting: true } as IntersectionObserverEntry], this as any);
  }
  disconnect() {}
  unobserve() {}
}

(global as any).IntersectionObserver = MockObserver;
(global as any).ResizeObserver = class {
  cb: () => void;
  constructor(cb: () => void) {
    this.cb = cb;
  }
  observe() {
    this.cb();
  }
  disconnect() {}
};

describe("Footer Component", () => {
  it("menampilkan judul 'Saluran Bantuan'", () => {
    render(<Footer />);
    expect(screen.getByRole("navigation", { name: "Saluran Bantuan" })).toBeInTheDocument();
  });

  it("menampilkan hotline Kementerian Kesehatan RI", () => {
    render(<Footer />);
    expect(screen.getByText("Kementerian Kesehatan RI")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Hotline: 1500-567" })).toBeInTheDocument();
  });

  it("menampilkan hotline Layanan Masyarakat Sehat", () => {
    render(<Footer />);
    expect(screen.getByText("Layanan Masyarakat Sehat (LMS)")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "0812-1212-3119" })).toBeInTheDocument();
  });

  it("menampilkan hotline Rumah Sakit Penyakit Infeksi Prof. Dr. Sulianti Saroso", () => {
    render(<Footer />);
    expect(screen.getByText("RS Infeksi Prof. Dr. Sulianti Saroso")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "(021) 6506559 / 6507024" })).toBeInTheDocument();
  });

  it("menampilkan hotline Pusat Informasi Kesehatan Terpadu", () => {
    render(<Footer />);
    expect(screen.getByText("Pusat Informasi Kesehatan Terpadu (PIKT)")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "0813-7690-5598" })).toBeInTheDocument();
  });

  it("menampilkan credit © PantauTular di kanan bawah", () => {
    render(<Footer />);
    expect(screen.getByText(`© ${new Date().getFullYear()} PantauTular. All rights reserved.`)).toBeInTheDocument();
  });

  it("creates sentinel element and cleans it up on unmount", () => {
    const { unmount } = render(<Footer />);
    expect(document.getElementById("pantautular-footer-sentinel")).toBeTruthy();
    unmount();
    expect(document.getElementById("pantautular-footer-sentinel")).toBeNull();
  });

  it("updates and removes css variable when visibility toggles", () => {
    const { rerender, unmount } = render(<Footer />);
    act(() => {
      (Footer as any).__setVisible?.(true);
    });
    rerender(<Footer />);
    expect(document.documentElement.style.getPropertyValue("--pt-footer-h")).not.toBe("");
    unmount();
    expect(document.documentElement.style.getPropertyValue("--pt-footer-h")).toBe("");
  });

  it("tidak menampilkan teks yang salah", () => {
    render(<Footer />);
    expect(screen.queryByText("Hotline: 1234-5678")).not.toBeInTheDocument();
    expect(screen.queryByText("Pusat Informasi Kesehatan Nasional")).not.toBeInTheDocument();
  });
});

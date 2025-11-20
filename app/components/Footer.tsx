"use client";

import React, { useEffect, useRef, useState, useLayoutEffect } from "react";

const Footer: React.FC = () => {
  const [visibleAtBottom, setVisibleAtBottom] = useState(false);
  const footerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const el = footerRef.current;
    if (!el) return;

    // sentinel di atas footer
    const sentinel = document.createElement("div");
    sentinel.id = "pantautular-footer-sentinel";
    sentinel.style.width = "1px";
    sentinel.style.height = "1px";
    sentinel.style.visibility = "hidden";
    el.parentNode?.insertBefore(sentinel, el);

    const observer = new IntersectionObserver(
      ([entry]) => setVisibleAtBottom(entry.isIntersecting),
      { root: null, threshold: 0.01 }
    );
    observer.observe(sentinel);

    return () => {
      observer.disconnect();
      sentinel.parentNode?.removeChild(sentinel);
    };
  }, []);

  // Update tinggi footer ke CSS variable agar layout.tsx bisa kasih padding bawah
  useLayoutEffect(() => {
    const el = footerRef.current;
    if (!el) return;

    const updateVar = () => {
      const h = visibleAtBottom ? el.offsetHeight : 0;
      document.documentElement.style.setProperty("--pt-footer-h", `${h}px`);
    };

    updateVar();
    const resizeObs = new ResizeObserver(updateVar);
    resizeObs.observe(el);
    window.addEventListener("resize", updateVar);

    return () => {
      resizeObs.disconnect();
      window.removeEventListener("resize", updateVar);
      document.documentElement.style.removeProperty("--pt-footer-h");
    };
  }, [visibleAtBottom]);

  (Footer as any).__setVisible = (value: boolean) => setVisibleAtBottom(value);

  return (
    <footer
      aria-hidden={!visibleAtBottom}
      ref={footerRef}
      className="fixed inset-x-0 bottom-0 z-50 bg-gradient-to-r from-[#0369a1] to-[#0284c7] text-white shadow-lg overflow-hidden"
      style={{
        opacity: visibleAtBottom ? 1 : 0,
        transform: visibleAtBottom ? "translateY(0)" : "translateY(8px)",
        transition: "opacity 250ms ease, transform 250ms ease",
        pointerEvents: visibleAtBottom ? "auto" : "none",
      }}
    >
      {/* isi footer kamu tetap sama */}
      <div className="max-w-6xl mx-auto px-4 py-5 md:py-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* Brand / description */}
          <div className="flex items-start md:items-center gap-3">
            <div className="flex-shrink-0 flex items-center">
              {/* plain larger logo from public/ (no ring) - increased size */}
              <img src="/logo-pantautular-white-removebg-preview.png" alt="PantauTular logo" className="w-20 h-20 object-contain" width={80} height={80} />
            </div>
            <div>
              <h3 className="text-sm font-semibold">PantauTular</h3>
              <p className="text-xs text-white/90 max-w-xs">Informasi cepat, akurat, dan terpercaya terkait kejadian penyakit menular di Indonesia.</p>
            </div>
          </div>

          {/* Contacts grid */}
          <nav aria-label="Saluran Bantuan" className="flex-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <address className="not-italic">
                <p className="font-medium text-xs">Kementerian Kesehatan RI</p>
                <a href="tel:1500567" className="text-xs underline">Hotline: 1500-567</a>
              </address>

              <address className="not-italic">
                <p className="font-medium text-xs">Layanan Masyarakat Sehat (LMS)</p>
                <a href="tel:081212123119" className="text-xs underline">0812-1212-3119</a>
              </address>

              <address className="not-italic">
                <p className="font-medium text-xs">RS Infeksi Prof. Dr. Sulianti Saroso</p>
                <a href="tel:0216506559" className="text-xs underline">(021) 6506559 / 6507024</a>
              </address>

              <address className="not-italic">
                <p className="font-medium text-xs">Pusat Informasi Kesehatan Terpadu (PIKT)</p>
                <a href="tel:081376905598" className="text-xs underline">0813-7690-5598</a>
              </address>
            </div>
          </nav>

          {/* Quick links / social */}
          <div className="flex flex-col items-end gap-2">
            <div className="flex gap-3 items-center">
              <a href="/about" className="text-xs text-white/95 hover:underline">Tentang</a>
              <span className="hidden sm:inline-block text-white/50">•</span>
              <a href="/help" className="text-xs text-white/95 hover:underline">Bantuan</a>
            </div>

            <div className="flex gap-3 items-center">
              {/* social icons: larger and accessible */}
              <a href="https://x.com/brin_indonesia" aria-label="Twitter" title="Twitter" target="_blank" rel="noopener noreferrer" className="p-1.5 rounded hover:bg-white/10">
                <span className="sr-only">Twitter</span>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="text-white/95 w-4 h-4">
                  <path d="M22 5.92c-.6.26-1.25.43-1.93.51a3.34 3.34 0 0 0 1.46-1.85c-.66.39-1.39.68-2.17.84A3.33 3.33 0 0 0 12.4 8.4c0 .26.03.51.08.75A9.47 9.47 0 0 1 3 5.16a3.33 3.33 0 0 0 1.03 4.44c-.5-.02-.97-.15-1.38-.38v.04c0 1.6 1.14 2.94 2.66 3.25a3.34 3.34 0 0 1-1.38.05c.39 1.2 1.53 2.08 2.88 2.11A6.68 6.68 0 0 1 2 19.54a9.41 9.41 0 0 0 5.12 1.5c6.15 0 9.52-5.13 9.52-9.58v-.44c.66-.47 1.22-1.06 1.67-1.73-.6.27-1.25.45-1.94.53z" />
                </svg>
              </a>

              <a href="https://www.facebook.com/brin.indonesia/?locale=id_ID" aria-label="Facebook" title="Facebook" target="_blank" rel="noopener noreferrer" className="p-1.5 rounded hover:bg-white/10">
                <span className="sr-only">Facebook</span>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="text-white/95 w-4 h-4">
                  <path d="M22 12a10 10 0 1 0-11.5 9.9v-7h-2.3v-2.9h2.3V9.2c0-2.3 1.4-3.6 3.5-3.6 1 0 2 .07 2 .07v2.3h-1.2c-1.2 0-1.6.76-1.6 1.5v1.8h2.7l-.4 2.9h-2.3v7A10 10 0 0 0 22 12" />
                </svg>
              </a>

              <a href="https://www.instagram.com/brin_indonesia/" aria-label="Instagram" title="Instagram" target="_blank" rel="noopener noreferrer" className="p-1.5 rounded hover:bg-white/10">
                <span className="sr-only">Instagram</span>
                <svg viewBox="0 0 24 24" className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" role="img" aria-hidden="false">
                  {/* white instagram outline */}
                  <rect x="3" y="3" width="18" height="18" rx="5" stroke="white" strokeWidth="1.5" fill="none" />
                  <circle cx="12" cy="12" r="3.5" stroke="white" strokeWidth="1.5" fill="none" />
                  <circle cx="17.5" cy="6.5" r="0.9" fill="white" />
                </svg>
              </a>

              <a href="https://id.linkedin.com/company/brin-ri" aria-label="LinkedIn" title="LinkedIn" target="_blank" rel="noopener noreferrer" className="p-1.5 rounded hover:bg-white/10">
                <span className="sr-only">LinkedIn</span>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="text-white/95 w-4 h-4">
                  <path d="M4.98 3.5A2.5 2.5 0 1 1 4.98 8.5 2.5 2.5 0 0 1 4.98 3.5zM3 9h4v12H3zM9 9h3.8v1.6h.1c.5-.9 1.7-1.8 3.4-1.8 3.6 0 4.3 2.4 4.3 5.5V21h-4v-5.1c0-1.2 0-2.8-1.7-2.8-1.7 0-2 1.4-2 2.7V21H9z" />
                </svg>
              </a>

              <a href="https://www.youtube.com/@brinindonesia1" aria-label="YouTube" title="YouTube" target="_blank" rel="noopener noreferrer" className="p-1.5 rounded hover:bg-white/10">
                <span className="sr-only">YouTube</span>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="text-white/95 w-4 h-4">
                  <path d="M23.5 6.2s-.2-1.6-.8-2.3c-.8-.9-1.7-.9-2.1-1C16.6 2 12 2 12 2s-4.6 0-8.6.9c-.4.1-1.3.1-2.1 1C.7 4.6.5 6.2.5 6.2S0 8.1 0 10v4c0 1.9.5 3.8.5 3.8s.2 1.6.8 2.3c.8.9 1.9.9 2.4 1 1.8.3 7.8.9 7.8.9s4.6 0 8.6-.9c.4-.1 1.3-.1 2.1-1 .6-.7.8-2.3.8-2.3S24 15.9 24 14v-4c0-1.9-.5-3.8-.5-3.8zM9.7 15.5V8.5l6.2 3.5-6.2 3.5z" />
                </svg>
              </a>
            </div>
          </div>
        </div>

        <div className="mt-4 border-t border-white/10 pt-3 text-xs text-white/80 flex flex-col md:flex-row md:justify-between gap-2">
          <p>© {new Date().getFullYear()} PantauTular. All rights reserved.</p>
          <p className="text-right">Didesain oleh Tim PantauTular</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
  

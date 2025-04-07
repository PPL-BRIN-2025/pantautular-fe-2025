import type { Metadata, Viewport } from "next";
import "../styles/globals.css";

const inter = { className: "" };

export const metadata: Metadata = {
  title: "PantauTular",
  description: "Platform informasi sebaran penyakit menular di Indonesia",
  other: {
    "http-equiv": "Content-Security-Policy",
    content: "upgrade-insecure-requests",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <script src="https://cdn.amcharts.com/lib/5/index.js"></script>
        <script src="https://cdn.amcharts.com/lib/5/xy.js"></script>
        <script src="https://cdn.amcharts.com/lib/5/themes/Animated.js"></script>
      </head>
      <body className={`${inter.className} min-h-screen`}>
        <main className="min-h-screen pt-20">
          {children}
        </main>
      </body>
    </html>
  );
}
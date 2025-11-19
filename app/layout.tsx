import type { Metadata, Viewport } from "next";
import "../styles/globals.css";
import { AuthProvider } from "./auth/provider";
import LogRocketInitializer from './logrocket-client';
import MicrosoftClarity from './components/MicrosoftClarity';

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
        <link rel="icon" href="/logo-p.png" sizes="any" />
        <script async type="text/javascript" src="/js/new-relic.js"></script>
        <script src="https://cdn.amcharts.com/lib/5/index.js"></script>
        <script src="https://cdn.amcharts.com/lib/5/xy.js"></script>
        <script src="https://cdn.amcharts.com/lib/5/themes/Animated.js"></script>
        <script src="https://cdn.amcharts.com/lib/5/plugins/exporting.js"></script>
      </head>
      <body className={`${inter.className} min-h-screen flex flex-col`}>
        <main 
          id="app-main"
          className="flex-1 pt-20"
          style={{
            // kasih padding bawah sesuai tinggi footer yang dikontrol CSS variable
            paddingBottom: "calc(var(--pt-footer-h, 0px) + env(safe-area-inset-bottom))",
          }}
        >
          <AuthProvider>
            <LogRocketInitializer />
            <MicrosoftClarity clarityId={process.env.NEXT_PUBLIC_CLARITY_ID || ''} />
            {children}
          </AuthProvider>
        </main>
      </body>
    </html>
  );
}

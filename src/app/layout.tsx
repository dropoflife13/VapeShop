import type { Metadata } from "next";
import {
  Anton,
  Fraunces,
  JetBrains_Mono,
  Plus_Jakarta_Sans,
} from "next/font/google";
import "./globals.css";

const anton = Anton({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-display",
});

const fraunces = Fraunces({
  style: ["italic"],
  weight: ["300", "400"],
  subsets: ["latin"],
  variable: "--font-serif",
});

const jetbrainsMono = JetBrains_Mono({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-mono",
});

const jakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "VapeVault — Authentic Devices, Express Pickup & Serial QR",
  description:
    "Browse live shelf stock, reserve in-store pickup for 60 minutes, and verify authentic devices via serial QR.",
  icons: {
    icon: [
      { url: "/images/logo-light.png", media: "(prefers-color-scheme: light)" },
      { url: "/images/logo-dark.png", media: "(prefers-color-scheme: dark)" },
    ],
    apple: "/images/logo-light.png",
  },
};

const THEME_PREPAINT_SCRIPT = `
(function() {
  try {
    var stored = localStorage.getItem('vv-theme') || 'dark';
    var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    var isDark = stored === 'dark' || (stored === 'system' && prefersDark);
    document.documentElement.classList.toggle('dark', isDark);
    document.documentElement.dataset.theme = stored;
  } catch (e) {}
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${anton.variable} ${fraunces.variable} ${jetbrainsMono.variable} ${jakartaSans.variable}`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_PREPAINT_SCRIPT }} />
      </head>
      <body className="min-h-screen bg-[var(--bg-canvas)] font-sans text-[var(--text-primary)] antialiased transition-colors duration-200 selection:bg-[#E86F12] selection:text-white">
        {children}
      </body>
    </html>
  );
}

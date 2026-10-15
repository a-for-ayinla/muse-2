import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Bagel_Fat_One, Fredoka } from "next/font/google";
import { ToastProvider } from "@/components/toast";
import { BackToTop } from "@/components/back-to-top";
import "./globals.css";

const bagel = Bagel_Fat_One({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-bagel-var",
});

const fredoka = Fredoka({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-fredoka-var",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
  title: {
    default: "Muse — Your sound. Your culture. Your AI.",
    template: "%s | Muse",
  },
  description:
    "Muse is a Nigerian AI music companion. Tell it the mood, the moment or the madness — in English or Pidgin — and get real songs, playlists and a creator studio.",
  openGraph: {
    siteName: "Muse",
    title: "Muse — Your sound. Your culture. Your AI.",
    description:
      "A Nigerian AI music companion for listeners, artists, DJs and creators. Grounded in a real catalog — never invents a song.",
    type: "website",
  },
};

const themeScript = `
(function () {
  var stored = null;
  try { stored = localStorage.getItem("muse-theme"); } catch (e) {}
  var theme = stored === "light" || stored === "dark"
    ? stored
    : (window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches
        ? "light"
        : "dark");
  document.documentElement.dataset.theme = theme;
})();
`;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className={`${bagel.variable} ${fredoka.variable} min-h-screen bg-bg font-fredoka text-tx antialiased`}>
        <a
          href="#main"
          className="sr-only z-[70] rounded-full bg-lime px-4 py-2 font-semibold text-ink focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
        >
          Skip to content
        </a>
        <ToastProvider>{children}</ToastProvider>
        <BackToTop />
      </body>
    </html>
  );
}

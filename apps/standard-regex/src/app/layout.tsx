import type { Metadata, Viewport } from "next";
import { buildMarketingMetadata } from "@market-standard/ui";
import "./globals.css";
import { fontClassName } from "@market-standard/ui/marketing/fonts";
import { MarketAnalytics } from "@market-standard/ui/marketing/analytics";
import { AppErrorBoundary } from "@market-standard/ui/marketing/error-boundary";

const title = "Standard Regex — Regex pattern builder + debugger by Market Standard";
const description =
  "Build, test, debug, and share regex patterns with capture-group highlighting, an explanation engine, and a cheat sheet. Save to library, fork public patterns, and deep-link into Standard Hook and Standard Snippets.";

export const metadata: Metadata = {
  title,
  description,
  ...buildMarketingMetadata({ product: "standard-regex", productLabel: "Standard Regex", title, description }),
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#08080c",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${fontClassName} h-full`} data-theme="market-standard">
      <body className="min-h-full antialiased"><AppErrorBoundary productLabel="Standard Regex">{children}</AppErrorBoundary><MarketAnalytics /></body>
    </html>
  );
}

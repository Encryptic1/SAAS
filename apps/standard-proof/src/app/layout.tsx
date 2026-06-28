import type { Metadata, Viewport } from "next";
import { buildMarketingMetadata } from "@market-standard/ui";
import "./globals.css";
import { fontClassName } from "@market-standard/ui/marketing/fonts";
import { MarketAnalytics } from "@market-standard/ui/marketing/analytics";
import { AppErrorBoundary } from "@market-standard/ui/marketing/error-boundary";

const title = "Standard Proof — Testimonial Wall by Market Standard";
const description = "Collect and embed customer testimonials. Every embed markets Market Standard, LLC.";

export const metadata: Metadata = {
  title,
  description,
  ...buildMarketingMetadata({ product: "standard-proof", productLabel: "Standard Proof", title, description }),
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#08080c",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${fontClassName} h-full`} data-theme="market-standard">
      <body className="min-h-full antialiased"><AppErrorBoundary productLabel="Standard Proof">{children}</AppErrorBoundary><MarketAnalytics /></body>
    </html>
  );
}

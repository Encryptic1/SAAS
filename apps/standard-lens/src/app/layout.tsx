import type { Metadata, Viewport } from "next";
import { buildMarketingMetadata } from "@market-standard/ui";
import "./globals.css";

const title = "Standard Lens — DB query optimizer + slow query detection by Market Standard";
const description =
  "Analyze SQL queries, visualize EXPLAIN plans, and catch slow queries before they hit production. Standard Lens scores every query, flags anti-patterns (SELECT *, full scans, function-on-column), and alerts on configurable duration thresholds. Deep-links into Standard Vault for connection strings and Standard Hook for webhook payload regex.";

export const metadata: Metadata = {
  title,
  description,
  ...buildMarketingMetadata({ product: "standard-lens", productLabel: "Standard Lens", title, description }),
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#08080c",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full" data-theme="market-standard">
      <body className="min-h-full antialiased">{children}</body>
    </html>
  );
}

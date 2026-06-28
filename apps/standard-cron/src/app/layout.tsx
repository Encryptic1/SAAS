import type { Metadata, Viewport } from "next";
import { buildMarketingMetadata } from "@market-standard/ui";
import "./globals.css";
import { fontClassName } from "@market-standard/ui/marketing/fonts";
import { MarketAnalytics } from "@market-standard/ui/marketing/analytics";
import { AppErrorBoundary } from "@market-standard/ui/marketing/error-boundary";

const title = "Standard Cron — cron monitor + alerting by Market Standard";
const description =
  "Monitor cron jobs across Vercel Cron, GitHub Actions, and FloodG8 runners. Each job gets a heartbeat URL — a missed window alerts Slack and Suite Pulse. Standard Cron parses 5-field cron expressions, shows run history, and flags missed or failed runs before users notice.";

export const metadata: Metadata = {
  title,
  description,
  ...buildMarketingMetadata({ product: "standard-cron", productLabel: "Standard Cron", title, description }),
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#08080c",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${fontClassName} h-full`} data-theme="market-standard">
      <body className="min-h-full antialiased"><AppErrorBoundary productLabel="Standard Cron">{children}</AppErrorBoundary><MarketAnalytics /></body>
    </html>
  );
}

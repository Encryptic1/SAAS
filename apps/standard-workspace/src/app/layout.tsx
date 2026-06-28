import type { Metadata, Viewport } from "next";
import { buildMarketingMetadata } from "@market-standard/ui";
import "./globals.css";
import { fontClassName } from "@market-standard/ui/marketing/fonts";
import { MarketAnalytics } from "@market-standard/ui/marketing/analytics";
import { AppErrorBoundary } from "@market-standard/ui/marketing/error-boundary";

const title = "Standard Workspace — Portfolio Control Panel by Market Standard";
const description =
  "One pane for the whole Market Standard suite: live status grid of 13 apps + FloodG8 + SyncDevTime + Supabase + Stripe. Start dev sessions, tail logs over SSE, manage webhook tunnels, and track dependency parity.";

export const metadata: Metadata = {
  title,
  description,
  ...buildMarketingMetadata({ product: "standard-workspace", productLabel: "Standard Workspace", title, description }),
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#08080c",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${fontClassName} h-full`} data-theme="market-standard">
      <body className="min-h-full antialiased"><AppErrorBoundary productLabel="Standard Workspace">{children}</AppErrorBoundary><MarketAnalytics /></body>
    </html>
  );
}

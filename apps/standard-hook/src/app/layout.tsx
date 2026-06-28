import type { Metadata, Viewport } from "next";
import { buildMarketingMetadata } from "@market-standard/ui";
import "./globals.css";

const title = "Standard Hook — Webhook Inbox by Market Standard";
const description = "Capture, inspect, and replay webhooks during development.";

export const metadata: Metadata = {
  title,
  description,
  ...buildMarketingMetadata({ product: "standard-hook", productLabel: "Standard Hook", title, description }),
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

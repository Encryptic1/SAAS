import type { Metadata, Viewport } from "next";
import { buildMarketingMetadata } from "@market-standard/ui";
import "./globals.css";

const title = "Standard Links — Stripe Payment Link Manager by Market Standard";
const description =
  "Shorten, brand, and instrument Stripe payment links with click tracking, UTM passthrough, and Metrics cross-sell.";

export const metadata: Metadata = {
  title,
  description,
  ...buildMarketingMetadata({ product: "standard-links", productLabel: "Standard Links", title, description }),
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

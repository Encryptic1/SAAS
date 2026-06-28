import type { Metadata, Viewport } from "next";
import { buildMarketingMetadata } from "@market-standard/ui";
import "./globals.css";

const title = "Standard Status — Build/CI Status Dashboard by Market Standard";
const description =
  "Build/CI status dashboard pulling GitHub Actions, Vercel deployments, and FloodG8 runner relay. Incident feed with severity + deploy health.";

export const metadata: Metadata = {
  title,
  description,
  ...buildMarketingMetadata({ product: "standard-status", productLabel: "Standard Status", title, description }),
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

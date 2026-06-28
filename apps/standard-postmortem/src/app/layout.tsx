import type { Metadata, Viewport } from "next";
import { buildMarketingMetadata } from "@market-standard/ui";
import "./globals.css";

const title = "Standard Postmortem — Blameless incident postmortem + recurrence by Market Standard";
const description =
  "Blameless incident postmortem tool with recurrence tracking, action items, and intake from Hook, Status, Pulse, and Slack. Catch recurring incidents before they catch you.";

export const metadata: Metadata = {
  title,
  description,
  ...buildMarketingMetadata({ product: "standard-postmortem", productLabel: "Standard Postmortem", title, description }),
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

import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Standard Hook — Webhook Inbox by Market Standard",
  description: "Capture, inspect, and replay webhooks during development.",
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

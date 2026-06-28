import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Standard Proof — Testimonial Wall by Market Standard",
  description: "Collect and embed customer testimonials. Every embed markets Market Standard, LLC.",
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

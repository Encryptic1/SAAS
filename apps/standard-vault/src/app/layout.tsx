import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Standard Vault — AI-Agent-Safe Secrets Manager by Market Standard",
  description:
    "Encrypted secrets with env-injection CLI, .env/Doppler import, GitHub Actions sync, and an AI-agent reference mode that lets agents see keys without seeing values.",
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

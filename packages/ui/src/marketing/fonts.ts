import { Inter, JetBrains_Mono } from "next/font/google";

/**
 * Shared next/font instances for the Market Standard suite.
 *
 * Using next/font (instead of a render-blocking Google Fonts @import) gives:
 *  - zero CLS / no layout shift
 *  - self-hosted font files served from the app origin
 *  - automatic <link rel="preload"> + font-display: swap
 *
 * Each app applies `${inter.variable} ${jetbrainsMono.variable}` to <html>,
 * which overrides the --font-sans / --font-mono CSS tokens defined in
 * tokens.css. The Google Fonts @import in tokens.css is removed once apps
 * adopt these.
 */
export const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "800", "900"],
  variable: "--font-sans",
  display: "swap",
});

export const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-mono",
  display: "swap",
});

/** Class string to apply to <html> for both font variables. */
export const fontClassName = `${inter.variable} ${jetbrainsMono.variable}`;

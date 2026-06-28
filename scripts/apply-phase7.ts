/**
 * One-shot Phase 7 applicator — wires next/font, Vercel Analytics, an error
 * boundary, sitemap.ts, robots.ts and a shared next.config wrapper into every
 * suite app. Idempotent: safe to re-run.
 *
 *   pnpm exec tsx scripts/apply-phase7.ts
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const APPS: Array<{ dir: string; key: string; label: string }> = [
  { dir: "standard-polls", key: "polls", label: "Standard Polls" },
  { dir: "standard-proof", key: "proof", label: "Standard Proof" },
  { dir: "standard-metrics", key: "metrics", label: "Standard Metrics" },
  { dir: "standard-hook", key: "hook", label: "Standard Hook" },
  { dir: "standard-release", key: "release", label: "Standard Release" },
  { dir: "standard-vault", key: "vault", label: "Standard Vault" },
  { dir: "standard-links", key: "links", label: "Standard Links" },
  { dir: "standard-snippets", key: "snippets", label: "Standard Snippets" },
  { dir: "standard-status", key: "status", label: "Standard Status" },
  { dir: "standard-regex", key: "regex", label: "Standard Regex" },
  { dir: "standard-postmortem", key: "postmortem", label: "Standard Postmortem" },
  { dir: "standard-lens", key: "lens", label: "Standard Lens" },
  { dir: "standard-cron", key: "cron", label: "Standard Cron" },
];

const LAYOUT_IMPORTS = `import { fontClassName } from "@market-standard/ui/marketing/fonts";
import { MarketAnalytics } from "@market-standard/ui/marketing/analytics";
import { AppErrorBoundary } from "@market-standard/ui/marketing/error-boundary";`;

function patchLayout(appDir: string, label: string): boolean {
  const file = path.join(ROOT, "apps", appDir, "src/app/layout.tsx");
  let src = fs.readFileSync(file, "utf8");
  if (src.includes("fontClassName")) return false; // already patched

  // Insert imports after the globals.css import (present in every app).
  if (!src.includes('import "./globals.css";')) {
    throw new Error(`${appDir}: missing globals.css import anchor`);
  }
  src = src.replace('import "./globals.css";', `import "./globals.css";\n${LAYOUT_IMPORTS}`);

  // Apply the font variable class to <html>.
  if (!src.includes('className="h-full"')) {
    throw new Error(`${appDir}: missing <html className="h-full"> anchor`);
  }
  src = src.replace('className="h-full"', 'className={`${fontClassName} h-full`}');

  // Wrap children in the error boundary + mount analytics in <body>.
  const oldBody = '<body className="min-h-full antialiased">{children}</body>';
  const newBody = `<body className="min-h-full antialiased"><AppErrorBoundary productLabel="${label}">{children}</AppErrorBoundary><MarketAnalytics /></body>`;
  if (!src.includes(oldBody)) {
    throw new Error(`${appDir}: missing <body> anchor`);
  }
  src = src.replace(oldBody, newBody);

  fs.writeFileSync(file, src, "utf8");
  return true;
}

function writeSitemap(appDir: string, key: string): void {
  const file = path.join(ROOT, "apps", appDir, "src/app/sitemap.ts");
  fs.writeFileSync(
    file,
    `import type { MetadataRoute } from "next";
import { buildSitemap } from "@market-standard/ui/marketing/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  return buildSitemap({ product: "${key}" });
}
`,
    "utf8",
  );
}

function writeRobots(appDir: string, key: string): void {
  const file = path.join(ROOT, "apps", appDir, "src/app/robots.ts");
  fs.writeFileSync(
    file,
    `import type { MetadataRoute } from "next";
import { buildRobots } from "@market-standard/ui/marketing/seo";

export default function robots(): MetadataRoute.Robots {
  return buildRobots({ product: "${key}" });
}
`,
    "utf8",
  );
}

function writeGlobalError(appDir: string, label: string): void {
  const file = path.join(ROOT, "apps", appDir, "src/app/global-error.tsx");
  fs.writeFileSync(
    file,
    `"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      // eslint-disable-next-line no-console
      console.error("[global-error]", error);
    }
  }, [error]);

  return (
    <html lang="en" data-theme="market-standard">
      <body
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "1rem",
          padding: "2rem",
          textAlign: "center",
          background: "#08080c",
          color: "#fff",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <h1 style={{ fontSize: "1.5rem", fontWeight: 700 }}>${label} hit a snag</h1>
        <p style={{ color: "#a8b0c2", maxWidth: "32rem" }}>
          An unexpected error occurred. Your data is safe — try again.
        </p>
        <button
          type="button"
          onClick={reset}
          style={{
            padding: "0.6rem 1.1rem",
            borderRadius: 6,
            border: "1px solid #39ff14",
            background: "rgba(57,255,20,0.12)",
            color: "#39ff14",
            cursor: "pointer",
            fontWeight: 600,
          }}
        >
          Try again
        </button>
        {process.env.NODE_ENV === "development" && (
          <pre style={{ maxWidth: "40rem", overflow: "auto", fontSize: "0.75rem", color: "#ff4d6d", whiteSpace: "pre-wrap" }}>
            {error.message}
          </pre>
        )}
      </body>
    </html>
  );
}
`,
    "utf8",
  );
}

function patchNextConfig(appDir: string): boolean {
  const file = path.join(ROOT, "apps", appDir, "next.config.ts");
  const next = `import { withMktStdConfig } from "@market-standard/ui/next-config";

export default withMktStdConfig({});
`;
  fs.writeFileSync(file, next, "utf8");
  return true;
}

let patched = 0;
for (const app of APPS) {
  const layoutPatched = patchLayout(app.dir, app.label);
  writeSitemap(app.dir, app.key);
  writeRobots(app.dir, app.key);
  writeGlobalError(app.dir, app.label);
  patchNextConfig(app.dir);
  console.log(`${app.dir}: layout=${layoutPatched ? "patched" : "skipped"} sitemap+robots+global-error+next.config=written`);
  patched += 1;
}
console.log(`\nApplied Phase 7 wiring to ${patched} apps.`);

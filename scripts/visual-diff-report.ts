/**
 * Final phase: generate a visual diff report comparing baseline screenshots
 * (screens/baseline/<app>/) against the final screenshots (screens/final/).
 * Outputs a markdown report at screens/final/REPORT.md with per-app coverage,
 * file-size deltas, and embedded final screenshots.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const BASELINE_DIR = path.join(ROOT, "screens", "baseline");
const FINAL_DIR = path.join(ROOT, "screens", "final");

const APPS = [
  "polls", "proof", "metrics", "hook", "release", "vault", "links",
  "snippets", "status", "regex", "postmortem", "lens", "cron", "workspace",
];

const PAGES = ["home", "dashboard", "billing"];
const VIEWPORTS = ["desktop", "mobile"];

function fileSizeKB(filePath: string): number | null {
  try {
    const stat = fs.statSync(filePath);
    return Math.round((stat.size / 1024) * 10) / 10;
  } catch {
    return null;
  }
}

function findBaseline(app: string, page: string, viewport: string): string | null {
  // Try <app>/<page>-<viewport>.png and <app>/dashboard-<page>-<viewport>.png
  const candidates = [
    path.join(BASELINE_DIR, app, `${page}-${viewport}.png`),
    path.join(BASELINE_DIR, app, `dashboard-${page}-${viewport}.png`),
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  return null;
}

async function main() {
  const lines: string[] = [];
  lines.push("# Visual Diff Report — Final Screenshots");
  lines.push("");
  lines.push(`Generated: ${new Date().toISOString()}`);
  lines.push("");
  lines.push("Compares **baseline** (Phase 0) screenshots against **final** (post-polish) screenshots.");
  lines.push("File-size delta is a rough proxy for visual change (added content, panels, navigation, etc.).");
  lines.push("");
  lines.push("## Summary");
  lines.push("");

  let totalBaseline = 0;
  let totalFinal = 0;
  let pairsCompared = 0;
  let finalOnly = 0;
  let baselineOnly = 0;

  for (const app of APPS) {
    lines.push(`### ${app}`);
    lines.push("");
    lines.push("| Page | Viewport | Baseline (KB) | Final (KB) | Delta | |");
    lines.push("|------|----------|---------------|------------|-------|-|");

    for (const page of PAGES) {
      for (const viewport of VIEWPORTS) {
        const finalName = `${app}-${page}.${viewport}.png`;
        const finalPath = path.join(FINAL_DIR, finalName);
        const baselinePath = findBaseline(app, page, viewport);

        const finalKB = fileSizeKB(finalPath);
        const baselineKB = baselinePath ? fileSizeKB(baselinePath) : null;

        if (finalKB !== null && baselineKB !== null) {
          const delta = Math.round(((finalKB - baselineKB) / baselineKB) * 100);
          const sign = delta >= 0 ? "+" : "";
          totalBaseline += baselineKB;
          totalFinal += finalKB;
          pairsCompared += 1;
          lines.push(`| ${page} | ${viewport} | ${baselineKB} | ${finalKB} | ${sign}${delta}% | ![${finalName}](./${finalName}) |`);
        } else if (finalKB !== null) {
          finalOnly += 1;
          lines.push(`| ${page} | ${viewport} | — | ${finalKB} | new | ![${finalName}](./${finalName}) |`);
        } else if (baselineKB !== null) {
          baselineOnly += 1;
          lines.push(`| ${page} | ${viewport} | ${baselineKB} | — | removed | — |`);
        } else {
          lines.push(`| ${page} | ${viewport} | — | — | — | — |`);
        }
      }
    }
    lines.push("");
  }

  const overallDelta = totalBaseline > 0 ? Math.round(((totalFinal - totalBaseline) / totalBaseline) * 100) : 0;
  lines.push("## Overall");
  lines.push("");
  lines.push(`- **Pairs compared**: ${pairsCompared}`);
  lines.push(`- **Final-only (new apps/pages)**: ${finalOnly}`);
  lines.push(`- **Baseline-only (removed)**: ${baselineOnly}`);
  lines.push(`- **Total baseline size**: ${totalBaseline} KB`);
  lines.push(`- **Total final size**: ${totalFinal} KB`);
  lines.push(`- **Overall delta**: ${overallDelta >= 0 ? "+" : ""}${overallDelta}%`);
  lines.push("");
  lines.push("## Notes");
  lines.push("");
  lines.push("- Baseline screenshots were captured at Phase 0 (before UI/UX polish).");
  lines.push("- Final screenshots were captured after all 12 phases of build & polish.");
  lines.push("- New apps (lens, cron, workspace) have no baseline — they were built during the project.");
  lines.push("- File-size increases generally reflect added dashboard panels, navigation, KPI cards,");
  lines.push("  notification center, suite-switcher, and design-system upgrades.");
  lines.push("");

  const reportPath = path.join(FINAL_DIR, "REPORT.md");
  fs.writeFileSync(reportPath, lines.join("\n"), "utf8");
  console.log(`Report written to ${path.relative(ROOT, reportPath)}`);
  console.log(`Pairs compared: ${pairsCompared}, final-only: ${finalOnly}, baseline-only: ${baselineOnly}`);
  console.log(`Overall delta: ${overallDelta >= 0 ? "+" : ""}${overallDelta}% (${totalBaseline} KB → ${totalFinal} KB)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

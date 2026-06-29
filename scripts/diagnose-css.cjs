/**
 * Diagnose whether the lg:grid-cols-[1fr_480px] class is generated in the
 * built CSS of each app. Compares a "good" app (metrics) vs a "bad" app
 * (workspace).
 */
const APPS = [
  { sub: "metrics", label: "good" },
  { sub: "workspace", label: "bad" },
  { sub: "snippets", label: "bad" },
  { sub: "lens", label: "bad" },
  { sub: "cron", label: "bad" },
];

async function main() {
  for (const { sub, label } of APPS) {
    const url = `https://${sub}.marketstandard.app/`;
    console.log(`\n--- ${sub} (${label}) ---`);
    try {
      const html = await fetch(url).then((r) => r.text());
      // Find all CSS stylesheet URLs
      const cssMatches = [...html.matchAll(/href="([^"]+\.css[^"]*)"/g)];
      const cssUrls = cssMatches.map((m) => m[1]).filter((u) => u.includes(".css"));
      console.log(`  CSS files: ${cssUrls.length}`);
      let foundGrid = false;
      let foundLgGrid = false;
      let foundFlexRow = false;
      for (const cssUrl of cssUrls.slice(0, 5)) {
        const fullUrl = cssUrl.startsWith("http") ? cssUrl : new URL(cssUrl, url).href;
        const css = await fetch(fullUrl).then((r) => r.text());
        if (css.includes("grid-cols-[1fr_480px]")) foundGrid = true;
        if (css.includes("lg\\:grid-cols-[1fr_480px]") || css.includes("lg\\:grid-cols-\\[1fr_480px\\]")) foundLgGrid = true;
        if (css.includes("sm\\:flex-row") || css.includes("sm\\:flex-row")) foundFlexRow = true;
      }
      console.log(`  grid-cols-[1fr_480px] present:   ${foundGrid}`);
      console.log(`  lg\\:grid-cols-[1fr_480px] present: ${foundLgGrid}`);
      console.log(`  sm\\:flex-row present:             ${foundFlexRow}`);
    } catch (err) {
      console.log(`  ERROR: ${err.message}`);
    }
  }
}

main().catch(console.error);

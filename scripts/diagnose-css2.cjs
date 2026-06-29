/**
 * Deeper diagnostic: check which Tailwind utility classes are present in
 * the built CSS of a good app (metrics) vs a bad app (workspace).
 */
async function fetchCss(url) {
  const html = await fetch(url).then((r) => r.text());
  const cssMatches = [...html.matchAll(/href="([^"]+\.css[^"]*)"/g)];
  const cssUrls = cssMatches.map((m) => m[1]).filter((u) => u.includes(".css"));
  let allCss = "";
  for (const cssUrl of cssUrls) {
    const fullUrl = cssUrl.startsWith("http") ? cssUrl : new URL(cssUrl, url).href;
    allCss += await fetch(fullUrl).then((r) => r.text());
  }
  return { html, css: allCss, cssUrls };
}

function check(css, needle) {
  // Tailwind escapes : as \: and [ as \[ and ] as \]
  const escaped = needle.replace(/:/g, "\\:").replace(/\[/g, "\\[").replace(/\]/g, "\\]");
  return css.includes(escaped);
}

async function main() {
  for (const sub of ["metrics", "workspace"]) {
    console.log(`\n=== ${sub} ===`);
    const { css, cssUrls } = await fetchCss(`https://${sub}.marketstandard.app/`);
    console.log(`  CSS files: ${cssUrls.length}`);
    console.log(`  CSS size:  ${css.length} bytes`);
    const probes = [
      "flex",
      "grid",
      "mt-7",
      "sm:flex-row",
      "sm:flex-wrap",
      "lg:grid-cols-[1fr_480px]",
      "max-w-5xl",
      "max-w-3xl",
      "ms-marketing",
      "ms-btn",
      "ms-hero-heading",
      "ms-eyebrow",
    ];
    for (const p of probes) {
      console.log(`  ${check(css, p) ? "Y" : "n"}  ${p}`);
    }
  }
}

main().catch(console.error);

const APPS = [
  { name: "vault", url: "https://vault.marketstandard.app/" },
  { name: "links", url: "https://links.marketstandard.app/" },
];

async function main() {
  for (const app of APPS) {
    const res = await fetch(app.url);
    const html = await res.text();
    const matches = html.match(/href="http:\/\/localhost:[^"]+"/g) || [];
    console.log(`\n${app.name} localhost hrefs (${matches.length}):`);
    matches.forEach((m) => console.log("  " + m));
    // Also show surrounding context for the first match
    if (matches.length > 0) {
      const idx = html.indexOf(matches[0]);
      const ctx = html.slice(Math.max(0, idx - 120), idx + matches[0].length + 40);
      console.log("  context: ..." + ctx.replace(/\n/g, " ").slice(0, 300) + "...");
    }
  }
}
main().catch((e) => { console.error(e); process.exit(1); });

/**
 * Fetch each production app's homepage HTML + check the top-nav links
 * for any remaining localhost references. Reports PASS/FAIL per app.
 */
const APPS = [
  { name: "polls", url: "https://polls.marketstandard.app/" },
  { name: "proof", url: "https://proof.marketstandard.app/" },
  { name: "metrics", url: "https://metrics.marketstandard.app/" },
  { name: "hook", url: "https://hook.marketstandard.app/" },
  { name: "release", url: "https://release.marketstandard.app/" },
  { name: "vault", url: "https://vault.marketstandard.app/" },
  { name: "links", url: "https://links.marketstandard.app/" },
  { name: "snippets", url: "https://snippets.marketstandard.app/" },
  { name: "status", url: "https://status.marketstandard.app/" },
  { name: "regex", url: "https://regex.marketstandard.app/" },
  { name: "postmortem", url: "https://postmortem.marketstandard.app/" },
  { name: "lens", url: "https://lens.marketstandard.app/" },
  { name: "cron", url: "https://cron.marketstandard.app/" },
  { name: "workspace", url: "https://workspace.marketstandard.app/" },
];

async function main() {
  let pass = 0;
  let fail = 0;
  for (const app of APPS) {
    try {
      const res = await fetch(app.url, { redirect: "follow" });
      const html = await res.text();
      const localhostCount = (html.match(/href="http:\/\/localhost:\d+/g) || []).length;
      const msCount = (html.match(/href="https:\/\/[a-z]+\.marketstandard\.app/g) || []).length;
      if (localhostCount === 0 && msCount > 0) {
        console.log(`  PASS ${app.name.padEnd(14)} localhost=0  marketstandard.app=${msCount}`);
        pass++;
      } else if (localhostCount > 0) {
        console.log(`  FAIL ${app.name.padEnd(14)} localhost=${localhostCount}  marketstandard.app=${msCount}`);
        fail++;
      } else {
        console.log(`  WARN ${app.name.padEnd(14)} localhost=0  marketstandard.app=0 (no nav links found?)`);
      }
    } catch (err) {
      console.log(`  ERR  ${app.name.padEnd(14)} ${err.message}`);
      fail++;
    }
  }
  console.log(`\n=== ${pass}/${APPS.length} apps clean (no localhost nav links) ===`);
  process.exit(fail === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

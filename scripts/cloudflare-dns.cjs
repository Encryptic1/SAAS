/**
 * Create 14 CNAME records for *.marketstandard.app -> cname.vercel-dns.com
 * via the Cloudflare REST API.
 */
const fs = require("node:fs");
const path = require("node:path");

const envPath = path.resolve(__dirname, "..", ".env.local");
const env = fs.readFileSync(envPath, "utf8");
const tokenMatch = env.match(/^CLOUDFLARE_API_TOKEN=(.+)$/m);
const token = tokenMatch ? tokenMatch[1].trim() : null;
if (!token) {
  console.error("CLOUDFLARE_API_TOKEN not found in .env.local");
  process.exit(1);
}

const ZONE_ID = "4bfe17823ce61079c5b26e8921a92341"; // marketstandard.app
const CNAME_TARGET = "cname.vercel-dns.com";

const SUBDOMAINS = [
  "polls",
  "proof",
  "metrics",
  "hook",
  "release",
  "vault",
  "links",
  "snippets",
  "status",
  "regex",
  "postmortem",
  "lens",
  "cron",
  "workspace",
];

async function apiCall(method, urlPath, body) {
  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
  const res = await fetch(`https://api.cloudflare.com/client/v4${urlPath}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    json = null;
  }
  return { status: res.status, json, text };
}

async function main() {
  // 1. Verify token
  console.log("--- Token verify ---");
  const verify = await apiCall("GET", "/user/tokens/verify");
  console.log(`  status: ${verify.status}`);
  if (verify.json) {
    console.log(`  success: ${verify.json.success}`);
    if (verify.json.result) {
      console.log(`  token status: ${verify.json.result.status}`);
      console.log(`  token id: ${verify.json.result.id}`);
    }
    if (verify.json.errors?.length) {
      console.log(`  errors: ${JSON.stringify(verify.json.errors)}`);
    }
  }

  // 2. List existing DNS records
  console.log("\n--- Existing DNS records ---");
  const list = await apiCall("GET", `/zones/${ZONE_ID}/dns_records?per_page=100`);
  console.log(`  status: ${list.status}`);
  if (list.json?.success) {
    console.log(`  count: ${list.json.result.length}`);
    const cnames = list.json.result.filter((r) => r.type === "CNAME");
    for (const r of cnames) {
      console.log(`  ${r.name} -> ${r.content} (proxied=${r.proxied})`);
    }
  } else {
    console.log(`  error: ${JSON.stringify(list.json?.errors || list.text)}`);
  }

  // 3. Create CNAME records
  console.log("\n--- Creating CNAME records ---");
  let ok = 0;
  let skip = 0;
  let fail = 0;
  const existing = list.json?.result || [];
  for (const sub of SUBDOMAINS) {
    const fqdn = `${sub}.marketstandard.app`;
    const existingRecord = existing.find(
      (r) => r.name === fqdn && r.type === "CNAME",
    );
    if (existingRecord) {
      if (existingRecord.content === CNAME_TARGET) {
        console.log(`  SKIP  ${fqdn} (already points to ${CNAME_TARGET})`);
        skip++;
      } else {
        console.log(
          `  SKIP  ${fqdn} (exists but points to ${existingRecord.content}, not ${CNAME_TARGET})`,
        );
        skip++;
      }
      continue;
    }
    const create = await apiCall("POST", `/zones/${ZONE_ID}/dns_records`, {
      type: "CNAME",
      name: sub,
      content: CNAME_TARGET,
      proxied: false,
      comment: `${fqdn} -> Vercel (standard-${sub} app)`,
    });
    if (create.json?.success) {
      console.log(`  OK    ${fqdn} -> ${CNAME_TARGET}`);
      ok++;
    } else {
      console.log(
        `  FAIL  ${fqdn} status=${create.status} err=${JSON.stringify(create.json?.errors || create.text).slice(0, 120)}`,
      );
      fail++;
    }
  }

  console.log(`\n=== Summary: ${ok} created, ${skip} skipped, ${fail} failed ===`);
  process.exit(fail > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

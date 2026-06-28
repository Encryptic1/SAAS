/**
 * Phase 9: generate docs/api/<app>-api.md per app with curl examples derived
 * from the app's API routes. Mirrors the route-scanning logic in gen-openapi.ts.
 *
 * Run: pnpm exec tsx scripts/gen-api-md.ts
 */
import { readFile, writeFile, mkdir, readdir, stat } from "node:fs/promises";
import { dirname, join } from "node:path";

type Method = "GET" | "POST" | "PATCH" | "DELETE" | "PUT";
const METHODS: Method[] = ["GET", "POST", "PATCH", "DELETE", "PUT"];

type App = { dir: string; title: string; description: string; baseUrl: string };

const APPS: App[] = [
  { dir: "standard-polls", title: "Standard Polls API", description: "Polls + Slack standup bot API.", baseUrl: "https://standard-polls.vercel.app" },
  { dir: "standard-proof", title: "Standard Proof API", description: "Testimonial collections API.", baseUrl: "https://standard-proof.vercel.app" },
  { dir: "standard-metrics", title: "Standard Metrics API", description: "Stripe revenue analytics + payment links API.", baseUrl: "https://standard-metrics.vercel.app" },
  { dir: "standard-hook", title: "Standard Hook API", description: "Webhook inbox capture + replay API.", baseUrl: "https://standard-hook.vercel.app" },
  { dir: "standard-release", title: "Standard Release API", description: "Release notes + repos API.", baseUrl: "https://standard-release.vercel.app" },
  { dir: "standard-vault", title: "Standard Vault API", description: "Secrets + projects + tokens API.", baseUrl: "https://standard-vault.vercel.app" },
  { dir: "standard-links", title: "Standard Links API", description: "Short links + click tracking API.", baseUrl: "https://standard-links.vercel.app" },
  { dir: "standard-snippets", title: "Standard Snippets API", description: "Code snippets + versions + shares API.", baseUrl: "https://standard-snippets.vercel.app" },
  { dir: "standard-status", title: "Standard Status API", description: "Pipelines + deployments + incidents API.", baseUrl: "https://standard-status.vercel.app" },
  { dir: "standard-regex", title: "Standard Regex API", description: "Regex patterns + forks API.", baseUrl: "https://standard-regex.vercel.app" },
  { dir: "standard-postmortem", title: "Standard Postmortem API", description: "Incidents + actions + recurrence API.", baseUrl: "https://standard-postmortem.vercel.app" },
  { dir: "standard-lens", title: "Standard Lens API", description: "Query library + slow queries + EXPLAIN API.", baseUrl: "https://standard-lens.vercel.app" },
  { dir: "standard-cron", title: "Standard Cron API", description: "Cron jobs + runs + heartbeat API.", baseUrl: "https://standard-cron.vercel.app" },
  { dir: "standard-workspace", title: "Standard Workspace API", description: "Sessions + health checks + tunnels + depsync API.", baseUrl: "https://standard-workspace.vercel.app" },
];

async function walk(dir: string, acc: string[] = []): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = join(dir, e.name);
    if (e.isDirectory()) await walk(full, acc);
    else if (e.name === "route.ts") acc.push(full.replace(/\\/g, "/"));
  }
  return acc;
}

function detectMethods(src: string): Method[] {
  return METHODS.filter((m) => new RegExp(`export\\s+async\\s+function\\s+${m}\\b`).test(src));
}

function filePathToApiPath(absRoute: string, appDir: string): string {
  const rel = relative(join("apps", appDir, "src", "app"), absRoute).replace(/\\/g, "/");
  return "/" + rel.replace(/\/route\.ts$/, "").replace(/\[(\w+)\]/g, "{$1}");
}

function relative(from: string, to: string): string {
  const fromParts = from.split(/[\\/]/).filter(Boolean);
  const toParts = to.split(/[\\/]/).filter(Boolean);
  let i = 0;
  while (i < fromParts.length && i < toParts.length && fromParts[i] === toParts[i]) i++;
  const up = "../".repeat(Math.max(fromParts.length - i - 1, 0));
  return up + toParts.slice(i).join("/");
}

function curlExample(app: App, method: Method, path: string): string {
  const params = [...path.matchAll(/\{(\w+)\}/g)].map((m) => m[1]);
  let urlPath = path;
  for (const p of params) urlPath = urlPath.replace(`{${p}}`, `<${p}>`);
  const fullUrl = `${app.baseUrl}${urlPath}`;
  const needsBody = method === "POST" || method === "PATCH" || method === "PUT";
  const flags = method === "GET" ? "" : ` \\\n  -X ${method}`;
  const body = needsBody
    ? ` \\\n  -H "content-type: application/json" \\\n  -d '${JSON.stringify({ example: "value" })}'`
    : "";
  return `curl${flags} \\\n  '${fullUrl}'${body}`;
}

function endpointSection(app: App, op: { method: Method; path: string }): string {
  const params = [...op.path.matchAll(/\{(\w+)\}/g)].map((m) => m[1]);
  const paramDocs = params.length
    ? `\n\n**Path parameters:**\n${params.map((p) => `- \`${p}\` (string, required)`).join("\n")}`
    : "";
  return `### ${op.method} ${op.path}

\`\`\`bash
${curlExample(app, op.method, op.path)}
\`\`\`${paramDocs}

Returns JSON. Throws \`ApiError\` on non-2xx responses.`;
}

async function buildOps(app: App): Promise<Array<{ method: Method; path: string }>> {
  const apiDir = join("apps", app.dir, "src", "app", "api");
  try {
    await stat(apiDir);
  } catch {
    return [];
  }
  const routes = await walk(apiDir);
  const ops: Array<{ method: Method; path: string }> = [];
  for (const route of routes) {
    const src = await readFile(route, "utf8");
    const path = filePathToApiPath(route, app.dir);
    for (const method of detectMethods(src)) ops.push({ method, path });
  }
  const order: Record<Method, number> = { GET: 0, POST: 1, PATCH: 2, PUT: 3, DELETE: 4 };
  ops.sort((a, b) => a.path.localeCompare(b.path) || order[a.method] - order[b.method]);
  return ops;
}

async function writeIfChanged(path: string, content: string): Promise<boolean> {
  let prev: string | null = null;
  try {
    prev = await readFile(path, "utf8");
  } catch {
    /* missing */
  }
  if (prev === content) return false;
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, content, "utf8");
  return true;
}

function apiMd(app: App, ops: Array<{ method: Method; path: string }>): string {
  const today = new Date().toISOString().slice(0, 10);
  const table = ops
    .map((op) => `| \`${op.method}\` | \`${op.path}\` |`)
    .join("\n");
  const sections = ops.map((op) => endpointSection(app, op)).join("\n\n");
  return `# ${app.title}

${app.description}

- **Base URL:** \`${app.baseUrl}\`
- **Local dev:** \`http://localhost:${3000 + APPS.indexOf(app) + 1}\`
- **Swagger UI:** [\`${app.baseUrl}/api/docs\`](${app.baseUrl}/api/docs)
- **OpenAPI JSON:** [\`${app.baseUrl}/api/openapi.json\`](${app.baseUrl}/api/openapi.json)
- **Postman collection:** [\`docs/postman/${app.dir}.postman.json\`](../postman/${app.dir}.postman.json)
- **TypeScript SDK:** \`import { create${app.title.replace(/\s+/g, "").replace("API", "Client")} } from "@market-standard/api-client"\`

## Authentication

All endpoints require an authenticated session cookie (Supabase Auth). Webhook
endpoints (\`/api/webhooks/stripe\`, \`/api/slack/events\`, etc.) verify signatures
instead. Cron endpoints (\`/api/cron/*\`) require a \`CRON_SECRET\` bearer token.

## Endpoints

| Method | Path |
| --- | --- |
${table}

## Examples

${sections}

---

_Generated by \`scripts/gen-api-md.ts\` on ${today}. Do not edit by hand._
`;
}

async function main() {
  let written = 0;
  for (const app of APPS) {
    const ops = await buildOps(app);
    const file = join("docs", "api", `${app.dir}-api.md`);
    if (await writeIfChanged(file, apiMd(app, ops))) written++;
  }
  console.log(`Phase 9 API.md: wrote ${written} files (up to date: ${APPS.length - written}).`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

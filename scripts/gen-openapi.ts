/**
 * Phase 9: generate an OpenAPI 3.0 spec + Swagger UI route for every app by
 * scanning every route.ts under src/app/api. Writes:
 *   - apps/<app>/src/lib/openapi.ts          (exports openApiDoc)
 *   - apps/<app>/src/app/api/openapi.json/route.ts  (GET -> spec JSON)
 *   - apps/<app>/src/app/api/docs/route.ts          (GET -> Swagger UI HTML)
 *
 * Also writes a Postman collection per app under docs/postman/<app>.postman.json.
 *
 * Run: pnpm exec tsx scripts/gen-openapi.ts
 */
import { readFile, writeFile, mkdir, readdir, stat } from "node:fs/promises";
import { dirname, join, relative } from "node:path";

type Method = "GET" | "POST" | "PATCH" | "DELETE" | "PUT";
const METHODS: Method[] = ["GET", "POST", "PATCH", "DELETE", "PUT"];

type App = { dir: string; title: string; description: string };

const APPS: App[] = [
  { dir: "standard-polls", title: "Standard Polls API", description: "Polls + Slack standup bot API." },
  { dir: "standard-proof", title: "Standard Proof API", description: "Testimonial collections API." },
  { dir: "standard-metrics", title: "Standard Metrics API", description: "Stripe revenue analytics + payment links API." },
  { dir: "standard-hook", title: "Standard Hook API", description: "Webhook inbox capture + replay API." },
  { dir: "standard-release", title: "Standard Release API", description: "Release notes + repos API." },
  { dir: "standard-links", title: "Standard Links API", description: "Short links + click tracking API." },
  { dir: "standard-vault", title: "Standard Vault API", description: "Secrets + projects + tokens API." },
  { dir: "standard-snippets", title: "Standard Snippets API", description: "Code snippets + versions + shares API." },
  { dir: "standard-status", title: "Standard Status API", description: "Pipelines + deployments + incidents API." },
  { dir: "standard-regex", title: "Standard Regex API", description: "Regex patterns + forks API." },
  { dir: "standard-postmortem", title: "Standard Postmortem API", description: "Incidents + actions + recurrence API." },
  { dir: "standard-lens", title: "Standard Lens API", description: "Query library + slow queries + EXPLAIN API." },
  { dir: "standard-cron", title: "Standard Cron API", description: "Cron jobs + runs + heartbeat API." },
  { dir: "standard-workspace", title: "Standard Workspace API", description: "Sessions + health checks + tunnels + depsync API." },
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
  const found: Method[] = [];
  for (const m of METHODS) {
    if (new RegExp(`export\\s+async\\s+function\\s+${m}\\b`).test(src)) found.push(m);
  }
  return found;
}

function filePathToApiPath(absRoute: string, appDir: string): string {
  // .../src/app/api/jobs/[id]/route.ts -> /api/jobs/{id}
  const rel = relative(join("apps", appDir, "src", "app"), absRoute).replace(/\\/g, "/");
  const withoutRoute = rel.replace(/\/route\.ts$/, "");
  return "/" + withoutRoute.replace(/\[(\w+)\]/g, "{$1}");
}

function resourceFromPath(path: string): string {
  const segs = path.split("/").filter(Boolean);
  for (let i = segs.length - 1; i >= 0; i--) {
    const s = segs[i];
    if (s === "api") continue;
    if (s.startsWith("[") || s.startsWith("{")) continue;
    return s.replace(/[{}]/g, "");
  }
  return "";
}

function topResource(path: string): string {
  const segs = path.split("/").filter(Boolean);
  return (segs[1] ?? "api").replace(/[{}]/g, "");
}

function singularize(w: string): string {
  if (!w) return "resource";
  if (w.endsWith("ies")) return w.slice(0, -3) + "y";
  if (w.endsWith("es")) return w.slice(0, -2);
  if (w.endsWith("s")) return w.slice(0, -1);
  return w;
}

function lastIsParam(path: string): boolean {
  const segs = path.split("/").filter(Boolean);
  const last = segs[segs.length - 1] ?? "";
  return last.startsWith("{") || last.startsWith("[");
}

function summaryFor(method: Method, path: string): string {
  const res = resourceFromPath(path);
  const sing = singularize(res);
  const hasPathParam = lastIsParam(path);
  switch (method) {
    case "GET":
      return hasPathParam ? `Get a ${sing}` : `List ${res || "resources"}`;
    case "POST":
      return hasPathParam ? `Action on ${sing}` : `Create a ${sing}`;
    case "PATCH":
      return `Update a ${sing}`;
    case "DELETE":
      return `Delete a ${sing}`;
    case "PUT":
      return `Replace a ${sing}`;
  }
}

function defaultResponses(method: Method): Record<string, object> {
  const r: Record<string, object> = {
    "200": { description: "OK", content: { "application/json": { schema: { type: "object" } } } },
  };
  if (method === "POST") r["201"] = { description: "Created", content: { "application/json": { schema: { type: "object" } } } };
  if (method === "DELETE") r["200"] = { description: "Deleted", content: { "application/json": { schema: { type: "object", properties: { ok: { type: "boolean" } } } } } };
  r["401"] = { description: "Unauthorized" };
  r["400"] = { description: "Bad request" };
  return r;
}

function paramsForPath(path: string): Array<{ name: string; in: string; required: boolean; schema: object }> {
  const matches = path.matchAll(/\{(\w+)\}/g);
  const params: Array<{ name: string; in: string; required: boolean; schema: object }> = [];
  for (const m of matches) {
    params.push({ name: m[1], in: "path", required: true, schema: { type: "string" } });
  }
  return params;
}

type Op = {
  path: string;
  method: Method;
  summary: string;
  tags: string[];
  params: Array<{ name: string; in: string; required: boolean; schema: object }>;
  responses: Record<string, object>;
};

async function buildOps(app: App): Promise<Op[]> {
  const apiDir = join("apps", app.dir, "src", "app", "api");
  let exists = true;
  try {
    await stat(apiDir);
  } catch {
    exists = false;
  }
  if (!exists) return [];
  const routes = await walk(apiDir);
  const ops: Op[] = [];
  for (const route of routes) {
    const src = await readFile(route, "utf8");
    const methods = detectMethods(src);
    const path = filePathToApiPath(route, app.dir);
    const tag = topResource(path) || "api";
    for (const method of methods) {
      ops.push({
        path,
        method,
        summary: summaryFor(method, path),
        tags: [tag],
        params: paramsForPath(path),
        responses: defaultResponses(method),
      });
    }
  }
  // Sort: by path then method order
  const order: Record<Method, number> = { GET: 0, POST: 1, PATCH: 2, PUT: 3, DELETE: 4 };
  ops.sort((a, b) => a.path.localeCompare(b.path) || order[a.method] - order[b.method]);
  return ops;
}

function buildOpenApiDoc(app: App, ops: Op[]): object {
  const paths: Record<string, Record<string, object>> = {};
  for (const op of ops) {
    const methodLower = op.method.toLowerCase();
    if (!paths[op.path]) paths[op.path] = {};
    paths[op.path][methodLower] = {
      summary: op.summary,
      tags: op.tags,
      parameters: op.params,
      responses: op.responses,
    };
  }
  return {
    openapi: "3.0.3",
    info: { title: app.title, version: "1.0.0", description: app.description },
    servers: [{ url: "/" }],
    tags: Array.from(new Set(ops.flatMap((o) => o.tags))).map((t) => ({ name: t })),
    paths,
  };
}

function openapiModule(app: App, doc: object): string {
  return `// AUTO-GENERATED by scripts/gen-openapi.ts — do not edit by hand.
export const openApiDoc = ${JSON.stringify(doc, null, 2)} as const;
export const openApiTitle = ${JSON.stringify(app.title)};
`;
}

const OPENAPI_ROUTE = `import { NextResponse } from "next/server";
import { openApiDoc } from "@/lib/openapi";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(openApiDoc, { headers: { "cache-control": "no-store" } });
}
`;

function docsRoute(app: App): string {
  const title = app.title.replace(" API", "");
  return `import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const HTML = \`<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${app.title} — docs</title>
<link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5.18.2/swagger-ui.css" />
<style>body { margin: 0 } .topbar { display: none }</style>
</head>
<body>
<div id="swagger-ui"></div>
<script src="https://unpkg.com/swagger-ui-dist@5.18.2/swagger-ui-bundle.js" crossorigin></script>
<script>
window.onload = () => {
  window.ui = SwaggerUIBundle({
    url: "/api/openapi.json",
    dom_id: "#swagger-ui",
    deepLinking: true,
    presets: [SwaggerUIBundle.presets.apis],
    layout: "BaseLayout",
    defaultModelsExpandDepth: -1,
  });
};
</script>
</body>
</html>\`;

export async function GET() {
  return new NextResponse(HTML, { headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" } });
}
`;
}

function postmanCollection(app: App, ops: Op[]): object {
  return {
    info: { name: app.title, schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json" },
    variable: [{ key: "baseUrl", value: "http://localhost:3000", type: "string" }],
    item: ops.map((op) => ({
      name: op.summary,
      request: {
        method: op.method,
        header: [{ key: "Content-Type", value: "application/json" }],
        url: {
          raw: `{{baseUrl}}${op.path}`,
          host: ["{{baseUrl}}"],
          path: op.path.split("/").filter(Boolean),
        },
      },
    })),
  };
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

async function main() {
  let written = 0;
  for (const app of APPS) {
    const ops = await buildOps(app);
    const doc = buildOpenApiDoc(app, ops);
    const base = join("apps", app.dir, "src");
    if (await writeIfChanged(join(base, "lib", "openapi.ts"), openapiModule(app, doc))) written++;
    if (await writeIfChanged(join(base, "app", "api", "openapi.json", "route.ts"), OPENAPI_ROUTE)) written++;
    if (await writeIfChanged(join(base, "app", "api", "docs", "route.ts"), docsRoute(app))) written++;
    if (await writeIfChanged(join("docs", "postman", `${app.dir}.postman.json`), JSON.stringify(postmanCollection(app, ops), null, 2)))
      written++;
  }
  console.log(`Phase 9 OpenAPI: wrote ${written} files across ${APPS.length} apps.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

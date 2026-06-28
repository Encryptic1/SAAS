/**
 * Phase 9: generate a typed client per app into packages/api-client/src/clients.
 * Each client extends ApiClient with one method per API operation discovered by
 * scanning the app's route.ts files. Also wires the exports map + index barrel.
 *
 * Run: pnpm exec tsx scripts/gen-sdk.ts
 */
import { readFile, writeFile, mkdir, readdir, stat } from "node:fs/promises";
import { dirname, join } from "node:path";

type Method = "GET" | "POST" | "PATCH" | "DELETE" | "PUT";
const METHODS: Method[] = ["GET", "POST", "PATCH", "DELETE", "PUT"];

type App = { dir: string; product: string; className: string; name: string };

const APPS: App[] = [
  { dir: "standard-polls", product: "standard-polls", className: "PollsClient", name: "polls" },
  { dir: "standard-proof", product: "standard-proof", className: "ProofClient", name: "proof" },
  { dir: "standard-metrics", product: "standard-metrics", className: "MetricsClient", name: "metrics" },
  { dir: "standard-hook", product: "standard-hook", className: "HookClient", name: "hook" },
  { dir: "standard-release", product: "standard-release", className: "ReleaseClient", name: "release" },
  { dir: "standard-links", product: "standard-links", className: "LinksClient", name: "links" },
  { dir: "standard-vault", product: "standard-vault", className: "VaultClient", name: "vault" },
  { dir: "standard-snippets", product: "standard-snippets", className: "SnippetsClient", name: "snippets" },
  { dir: "standard-status", product: "standard-status", className: "StatusClient", name: "status" },
  { dir: "standard-regex", product: "standard-regex", className: "RegexClient", name: "regex" },
  { dir: "standard-postmortem", product: "standard-postmortem", className: "PostmortemClient", name: "postmortem" },
  { dir: "standard-lens", product: "standard-lens", className: "LensClient", name: "lens" },
  { dir: "standard-cron", product: "standard-cron", className: "CronClient", name: "cron" },
  { dir: "standard-workspace", product: "standard-workspace", className: "WorkspaceClient", name: "workspace" },
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
  // minimal relative path calc (both absolute or both relative to cwd)
  const fromParts = from.split(/[\\/]/).filter(Boolean);
  const toParts = to.split(/[\\/]/).filter(Boolean);
  let i = 0;
  while (i < fromParts.length && i < toParts.length && fromParts[i] === toParts[i]) i++;
  const up = "../".repeat(Math.max(fromParts.length - i - 1, 0));
  return up + toParts.slice(i).join("/");
}

function pascal(s: string): string {
  return s
    .split(/[^A-Za-z0-9]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join("");
}

function singularize(w: string): string {
  if (!w) return "Resource";
  if (w.endsWith("ies")) return w.slice(0, -3) + "y";
  if (w.endsWith("es")) return w.slice(0, -2);
  if (w.endsWith("s")) return w.slice(0, -1);
  return w;
}

function toIdent(s: string): string {
  const parts = s.split(/[^A-Za-z0-9]+/).filter(Boolean);
  if (parts.length === 0) return "Resource";
  const first = parts[0].toLowerCase();
  const rest = parts.slice(1).map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
  return first + rest.join("");
}

function resourceFromPath(path: string): string {
  const segs = path.split("/").filter(Boolean);
  // Last segment that is not a path param (e.g. /api/team/{id}/members -> members)
  for (let i = segs.length - 1; i >= 0; i--) {
    const s = segs[i];
    if (s === "api") continue;
    if (s.startsWith("[") || s.startsWith("{")) continue;
    return toIdent(s.replace(/[{}]/g, ""));
  }
  return "";
}

function lastIsParam(path: string): boolean {
  const segs = path.split("/").filter(Boolean);
  const last = segs[segs.length - 1] ?? "";
  return last.startsWith("{") || last.startsWith("[");
}

function methodName(method: Method, path: string): string {
  const res = resourceFromPath(path);
  const sing = singularize(res);
  const hasParam = lastIsParam(path);
  const cap = (w: string) => (w ? w.charAt(0).toUpperCase() + w.slice(1) : "");
  switch (method) {
    case "GET":
      return hasParam ? `get${cap(sing)}` : `list${cap(res) || "All"}`;
    case "POST":
      return hasParam ? `post${pascal(path.replace(/^\/api\//, ""))}` : `create${cap(sing)}`;
    case "PATCH":
      return `update${cap(sing)}`;
    case "DELETE":
      return `delete${cap(sing)}`;
    case "PUT":
      return `replace${cap(sing)}`;
  }
}

function buildCall(method: Method, path: string): { args: string; bodyParam: string; callExpr: string } {
  const params = [...path.matchAll(/\{(\w+)\}/g)].map((m) => m[1]);
  const args = params.map((p) => `${p}: string`).join(", ");
  let callPath = path;
  for (const p of params) callPath = callPath.replace(`{${p}}`, `\${${p}}`);
  const fn = method.toLowerCase();
  const needsBody = method === "POST" || method === "PATCH" || method === "PUT";
  const bodyParam = needsBody ? "body?: any" : "";
  const callExpr = needsBody
    ? `this.${fn}<any>(\`${callPath}\`, body)`
    : `this.${fn}<any>(\`${callPath}\`)`;
  return { args, bodyParam, callExpr };
}

function clientModule(app: App, ops: Array<{ method: Method; path: string }>): string {
  const seen = new Map<string, number>();
  const methods = ops.map((op) => {
    let name = methodName(op.method, op.path);
    // Deduplicate method names: append _2, _3, ... on collision.
    if (seen.has(name)) {
      const n = (seen.get(name) ?? 1) + 1;
      seen.set(name, n);
      name = `${name}_${n}`;
    } else {
      seen.set(name, 1);
    }
    const { args, bodyParam, callExpr } = buildCall(op.method, op.path);
    const params = [args, bodyParam].filter(Boolean).join(", ");
    return `  /** ${op.method} ${op.path} */
  ${name}(${params}): Promise<any> {
    return ${callExpr};
  }`;
  });
  return `// AUTO-GENERATED by scripts/gen-sdk.ts — do not edit by hand.
import { ApiClient, type ApiClientOptions } from "../base";

/**
 * Typed client for ${app.product}. Construct with a baseUrl pointing at the
 * app origin (e.g. https://standard-lens.vercel.app). All methods return the
 * parsed JSON response and throw ApiError on non-2xx responses.
 */
export class ${app.className} extends ApiClient {
  constructor(opts: ApiClientOptions = {}) {
    super(opts);
  }
${methods.join("\n")}
}

export const create${app.className} = (opts?: ApiClientOptions) => new ${app.className}(opts);
`;
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

async function main() {
  let written = 0;
  const exportLines: string[] = [];
  const exportsMap: Record<string, string> = { ".": "./src/index.ts", "./base": "./src/base.ts" };

  for (const app of APPS) {
    const ops = await buildOps(app);
    const file = join("packages", "api-client", "src", "clients", `${app.name}.ts`);
    if (await writeIfChanged(file, clientModule(app, ops))) written++;
    exportLines.push(`export { ${app.className}, create${app.className} } from "./clients/${app.name}";`);
    exportsMap[`./${app.name}`] = `./src/clients/${app.name}.ts`;
  }

  // Index barrel
  const indexSrc = `export { ApiClient, ApiError, type ApiClientOptions } from "./base";\n${exportLines.join("\n")}\n`;
  await writeIfChanged(join("packages", "api-client", "src", "index.ts"), indexSrc);

  // package.json exports
  const pkgPath = join("packages", "api-client", "package.json");
  const pkg = JSON.parse(await readFile(pkgPath, "utf8"));
  pkg.exports = exportsMap;
  await writeFile(pkgPath, JSON.stringify(pkg, null, 2) + "\n", "utf8");

  console.log(`Phase 9 SDK: wrote ${written} client modules + barrel + exports map.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

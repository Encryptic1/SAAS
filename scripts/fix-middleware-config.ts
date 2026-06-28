/**
 * One-off fix: inline the `config` export in every app's middleware.ts so
 * Next.js can statically analyze it at build time. The shared
 * `authMiddlewareConfig` import is replaced with an inline object literal.
 */
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const APPS_DIR = path.join(ROOT, "apps");

const OLD = `import { createAuthMiddleware, authMiddlewareConfig } from "@market-standard/auth/middleware";`;
const NEW = `import { createAuthMiddleware } from "@market-standard/auth/middleware";`;

const CONFIG_OLD = `export const config = authMiddlewareConfig;`;
const CONFIG_NEW = `export const config = {
  matcher: ["/dashboard/:path*", "/login"],
};`;

async function main() {
  const apps = (await fs.readdir(APPS_DIR)).filter((d) => !d.startsWith(".") && d.startsWith("standard-"));
  let changed = 0;
  for (const app of apps) {
    const file = path.join(APPS_DIR, app, "src", "middleware.ts");
    let src: string;
    try {
      src = await fs.readFile(file, "utf8");
    } catch {
      continue;
    }
    if (!src.includes("authMiddlewareConfig")) {
      console.log(`skip  ${app} (already inlined or missing)`);
      continue;
    }
    const next = src.replace(OLD, NEW).replace(CONFIG_OLD, CONFIG_NEW);
    if (next === src) {
      console.log(`skip  ${app} (no match)`);
      continue;
    }
    await fs.writeFile(file, next, "utf8");
    console.log(`fixed ${app}`);
    changed += 1;
  }
  console.log(`\nDone. ${changed} middleware file(s) updated.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

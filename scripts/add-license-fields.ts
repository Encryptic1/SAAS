/**
 * Phase 10: add `license: "MIT"` and `author: "Market Standard"` to every
 * package.json in packages/* and apps/* that does not already declare them.
 * Preserves key ordering (name, version, private, license, author, ...).
 */
import { readFile, writeFile, readdir, stat } from "node:fs/promises";
import { join } from "node:path";

const TOP_KEYS = ["name", "version", "private"];

async function isDir(p: string): Promise<boolean> {
  try {
    return (await stat(p)).isDirectory();
  } catch {
    return false;
  }
}

async function updatePackageJson(file: string): Promise<boolean> {
  const raw = await readFile(file, "utf8");
  const pkg = JSON.parse(raw);
  if (pkg.license === "MIT" && pkg.author === "Market Standard") return false;
  pkg.license = "MIT";
  pkg.author = "Market Standard";
  // Re-serialize with stable key ordering: top keys first, then the rest.
  const ordered: Record<string, unknown> = {};
  for (const k of TOP_KEYS) if (k in pkg) ordered[k] = pkg[k];
  if (!("license" in ordered)) ordered.license = "MIT";
  ordered.license = "MIT";
  ordered.author = "Market Standard";
  for (const k of Object.keys(pkg)) {
    if ([...TOP_KEYS, "license", "author"].includes(k)) continue;
    ordered[k] = pkg[k];
  }
  await writeFile(file, JSON.stringify(ordered, null, 2) + "\n", "utf8");
  return true;
}

async function main() {
  let changed = 0;
  for (const scope of ["packages", "apps"]) {
    const entries = await readdir(scope);
    for (const name of entries) {
      const dir = join(scope, name);
      if (!(await isDir(dir))) continue;
      const file = join(dir, "package.json");
      try {
        await stat(file);
      } catch {
        continue;
      }
      if (await updatePackageJson(file)) changed++;
    }
  }
  console.log(`Phase 10: updated license/author in ${changed} package.json files.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

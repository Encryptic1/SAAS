import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import type { DepsyncReport } from "@/components/depsync-viewer";

/**
 * Compute a dependency-parity report across all apps by reading each app's
 * package.json and comparing @market-standard/* versions.
 *
 * In local dev this reads the filesystem directly. In production (Vercel)
 * the build-time snapshot is used; if unavailable, returns an empty report.
 */
export async function computeDepsyncReport(): Promise<DepsyncReport> {
  const appsDir = join(process.cwd(), "apps");
  let appDirs: string[];
  try {
    appDirs = (await readdir(appsDir)).filter((d) => !d.startsWith("."));
  } catch {
    return { packages: [], divergent: [], generatedAt: new Date().toISOString() };
  }

  const perApp: Array<{ app: string; packages: Array<{ name: string; version: string }> }> = [];
  for (const app of appDirs) {
    try {
      const raw = await readFile(join(appsDir, app, "package.json"), "utf8");
      const pkg = JSON.parse(raw) as { dependencies?: Record<string, string>; devDependencies?: Record<string, string> };
      const all = { ...(pkg.dependencies ?? {}), ...(pkg.devDependencies ?? {}) };
      const mspkgs = Object.entries(all)
        .filter(([name]) => name.startsWith("@market-standard/"))
        .map(([name, version]) => ({ name, version }));
      perApp.push({ app, packages: mspkgs });
    } catch {
      // app without package.json — skip
    }
  }

  // Index by package name
  const byPackage = new Map<string, Array<{ app: string; version: string }>>();
  for (const entry of perApp) {
    for (const p of entry.packages) {
      const arr = byPackage.get(p.name) ?? [];
      arr.push({ app: entry.app, version: p.version });
      byPackage.set(p.name, arr);
    }
  }

  const packages = Array.from(byPackage.entries()).map(([name, versions]) => ({ name, versions }));
  const divergent = packages
    .map((p) => {
      const uniqueVersions = Array.from(new Set(p.versions.map((v) => v.version)));
      const apps = p.versions.filter((v) => v.version !== uniqueVersions[0]).map((v) => v.app);
      return { name: p.name, uniqueVersions, apps: Array.from(new Set(apps)) };
    })
    .filter((d) => d.uniqueVersions.length > 1);

  return { packages, divergent, generatedAt: new Date().toISOString() };
}

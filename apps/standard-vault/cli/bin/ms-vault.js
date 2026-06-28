#!/usr/bin/env node
// Bootstrap: invoke the TypeScript CLI via tsx so we don't need a build step.
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const tsx = resolve(__dirname, "../node_modules/tsx/dist/cli.mjs");
const entry = resolve(__dirname, "../src/main.ts");

const result = spawnSync(
  process.execPath,
  [tsx, entry, ...process.argv.slice(2)],
  {
    stdio: "inherit",
    env: process.env,
    shell: false,
  },
);

if (result.error) {
  console.error(result.error.message);
  process.exit(1);
}
process.exit(result.status ?? 0);

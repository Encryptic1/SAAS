import path from "node:path";

export const ROOT = path.resolve(process.cwd());
export const STATE_FILE = path.join(ROOT, "e2e", ".e2e-stack-state.json");

export const HEALTH_URLS = [
  "http://127.0.0.1:4000/health",
  "http://localhost:3001",
  "http://localhost:3002",
  "http://localhost:3003",
  "http://localhost:3004",
  "http://localhost:3005",
  "http://localhost:3006",
  "http://localhost:3007",
  "http://localhost:3008",
  "http://localhost:3009",
  "http://localhost:3010",
  "http://localhost:3011",
] as const;

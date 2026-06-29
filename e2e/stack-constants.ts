import path from "node:path";

export const ROOT = path.resolve(process.cwd());
export const STATE_FILE = path.join(ROOT, "e2e", ".e2e-stack-state.json");

export const HEALTH_URLS = [
  "http://127.0.0.1:4000/health",
  "http://localhost:3001/api/health",
  "http://localhost:3002/api/health",
  "http://localhost:3003/api/health",
  "http://localhost:3004/api/health",
  "http://localhost:3005/api/health",
  "http://localhost:3006/api/health",
  "http://localhost:3007/api/health",
  "http://localhost:3008/api/health",
  "http://localhost:3009/api/health",
  "http://localhost:3010/api/health",
  "http://localhost:3011/api/health",
  "http://localhost:3012/api/health",
  "http://localhost:3013/api/health",
  "http://localhost:3014/api/health",
] as const;

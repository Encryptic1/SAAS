import { defineConfig } from "drizzle-kit";

const isPglite = process.env.DATABASE_DRIVER === "pglite";

export default defineConfig({
  schema: "./src/schema/index.ts",
  out: "./drizzle",
  dialect: "postgresql",
  ...(isPglite ? { driver: "pglite" as const } : {}),
  dbCredentials: {
    url: isPglite
      ? (process.env.PGLITE_DATA_DIR ?? "../../.pglite/market-standard")
      : (process.env.DATABASE_URL ?? "postgresql://127.0.0.1:54322/postgres"),
  },
  schemaFilter: ["shared", "polls", "proof", "metrics"],
});

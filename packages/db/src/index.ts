import { drizzle } from "drizzle-orm/postgres-js";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema/index";

export type AppDatabase = PostgresJsDatabase<typeof schema>;

let postgresClient: ReturnType<typeof postgres> | null = null;
let postgresDb: PostgresJsDatabase<typeof schema> | null = null;

function getPostgresDb(): PostgresJsDatabase<typeof schema> {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("Missing DATABASE_URL");
  }
  if (!postgresClient || !postgresDb) {
    postgresClient = postgres(url, { prepare: false, max: 10 });
    postgresDb = drizzle(postgresClient, { schema });
  }
  return postgresDb;
}

export async function getDbAsync(): Promise<AppDatabase> {
  return getPostgresDb();
}

export function getDb(): PostgresJsDatabase<typeof schema> {
  return getPostgresDb();
}

export type Database = AppDatabase;

export function isPgliteMode(): boolean {
  return process.env.DATABASE_URL?.includes("54322") === true;
}

export { resolvePgliteDir } from "./local";
export { fetchGateway, isLocalGatewayMode, patchGateway, postGateway, deleteGateway } from "./gateway";
export { trackKpi } from "./kpi";

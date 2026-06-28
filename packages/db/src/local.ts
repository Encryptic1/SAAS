import { existsSync, mkdirSync } from "node:fs";
import path from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import type { PgliteDatabase } from "drizzle-orm/pglite";
import * as schema from "./schema/index";

export function resolvePgliteDir(): string {
  let dir: string;

  if (process.env.PGLITE_DATA_DIR) {
    dir = path.isAbsolute(process.env.PGLITE_DATA_DIR)
      ? process.env.PGLITE_DATA_DIR
      : path.resolve(process.cwd(), process.env.PGLITE_DATA_DIR);
  } else {
    const candidates = [
      path.resolve(process.cwd(), ".pglite/market-standard"),
      path.resolve(process.cwd(), "../../.pglite/market-standard"),
      path.resolve(process.cwd(), "../../../.pglite/market-standard"),
    ];
    dir = candidates.find((c) => existsSync(c)) ?? candidates[1] ?? candidates[0]!;
  }

  return path.normalize(dir);
}

type Db = PgliteDatabase<typeof schema>;

let client: PGlite | null = null;
let db: Db | null = null;
let ready: Promise<Db> | null = null;

export async function getPgliteDb(): Promise<Db> {
  if (db) return db;

  if (!ready) {
    ready = (async () => {
      const dataDir = resolvePgliteDir();
      if (!existsSync(dataDir)) {
        mkdirSync(dataDir, { recursive: true });
      }

      client = new PGlite(dataDir);
      await client.waitReady;
      db = drizzle(client, { schema });
      return db;
    })();
  }

  return ready;
}

export async function closePglite(): Promise<void> {
  if (client) {
    await client.close();
    client = null;
    db = null;
    ready = null;
  }
}

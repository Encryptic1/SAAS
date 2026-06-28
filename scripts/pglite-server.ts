import path from "node:path";
import { existsSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { PGlite } from "@electric-sql/pglite";
import { PGLiteSocketServer } from "@electric-sql/pglite-socket";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const DATA_DIR = path.join(ROOT, ".pglite", "market-standard");
const PORT = Number(process.env.PGLITE_PORT ?? 54322);

async function main() {
  console.log(`Starting PGlite socket server...`);
  console.log(`  Data: ${DATA_DIR}`);
  console.log(`  Port: ${PORT}`);

  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true });
  }

  const db = new PGlite(DATA_DIR);
  await db.waitReady;

  const server = new PGLiteSocketServer({
    db,
    port: PORT,
    host: "127.0.0.1",
  });

  await server.start();

  console.log(`\nPGlite ready: postgresql://127.0.0.1:${PORT}/postgres`);
  console.log("Press Ctrl+C to stop.\n");

  const shutdown = async () => {
    await server.stop();
    await db.close();
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

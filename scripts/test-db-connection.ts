import postgres from "postgres";

async function main() {
  const sql = postgres("postgresql://127.0.0.1:54322/postgres");
  const result = await sql`SELECT 1 as ok`;
  console.log(result);
  await sql.end();
}

main().catch(console.error);

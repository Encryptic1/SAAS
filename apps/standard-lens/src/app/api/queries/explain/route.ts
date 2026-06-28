import { NextResponse } from "next/server";
import { analyzeQuery } from "@/lib/explain";

export async function POST(request: Request) {
  const body = (await request.json()) as { sql?: string };
  if (!body.sql || !body.sql.trim()) {
    return NextResponse.json({ error: "sql required" }, { status: 400 });
  }
  const result = analyzeQuery(body.sql);
  return NextResponse.json({ result });
}

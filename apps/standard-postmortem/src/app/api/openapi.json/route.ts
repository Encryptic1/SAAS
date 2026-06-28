import { NextResponse } from "next/server";
import { openApiDoc } from "@/lib/openapi";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(openApiDoc, { headers: { "cache-control": "no-store" } });
}

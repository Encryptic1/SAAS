import { NextResponse } from "next/server";
import { computeDepsyncReport } from "@/lib/depsync";

export const dynamic = "force-dynamic";

export async function GET() {
  const report = await computeDepsyncReport();
  return NextResponse.json(report, { headers: { "cache-control": "no-store" } });
}

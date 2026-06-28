import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    product: "standard-cron",
    timestamp: new Date().toISOString(),
  });
}

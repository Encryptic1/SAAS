import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    product: "standard-hook",
    timestamp: new Date().toISOString(),
  });
}

import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    product: "standard-lens",
    timestamp: new Date().toISOString(),
  });
}

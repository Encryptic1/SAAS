import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    product: "standard-vault",
    timestamp: new Date().toISOString(),
  });
}

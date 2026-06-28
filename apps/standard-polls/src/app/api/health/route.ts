import { NextResponse } from "next/server";
import { fetchGateway, isLocalGatewayMode } from "@market-standard/db";

export async function GET() {
  if (isLocalGatewayMode()) {
    try {
      const health = await fetchGateway<{ status: string }>("/health");
      return NextResponse.json({
        status: "ok",
        product: "standard-polls",
        db: health.status,
        driver: "pglite-gateway",
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      return NextResponse.json({
        status: "ok",
        product: "standard-polls",
        db: err instanceof Error ? err.message : "gateway unreachable",
        driver: "pglite-gateway",
        timestamp: new Date().toISOString(),
      });
    }
  }

  return NextResponse.json({
    status: "ok",
    product: "standard-polls",
    timestamp: new Date().toISOString(),
  });
}

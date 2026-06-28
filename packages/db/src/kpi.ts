import { getDbAsync, isLocalGatewayMode } from "@market-standard/db";
import { kpiEvents } from "@market-standard/db/schema/shared";

export async function trackKpi(
  product: string,
  event: string,
  userId?: string | null,
  metadata?: Record<string, unknown>,
): Promise<void> {
  if (isLocalGatewayMode()) return;
  try {
    const db = await getDbAsync();
    await db.insert(kpiEvents).values({
      product,
      event,
      userId: userId ?? null,
      metadata: metadata ?? null,
    });
  } catch {
    // non-fatal
  }
}

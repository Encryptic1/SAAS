import { and, eq } from "drizzle-orm";
import { billingCustomers } from "@market-standard/db/schema/shared";
import { fetchGateway, getDbAsync, isLocalGatewayMode } from "@market-standard/db";
import type { PlanTier, ProductId } from "./plans";

export interface BillingCustomerSnapshot {
  product: ProductId;
  externalUserId: string;
  stripeCustomerId: string;
  stripeSubscriptionId: string | null;
  plan: PlanTier;
  showBadge: boolean;
}

/**
 * Loads the current plan for a user+product pair.
 *
 * In local-dev (gateway) mode, hits the gateway's `/billing/customer` route
 * so the page never needs a direct Postgres connection. Returns "free" when
 * no row exists or when the user is null.
 */
export async function loadCurrentPlan(
  product: ProductId,
  userId: string | null | undefined,
): Promise<PlanTier> {
  if (!userId) return "free";

  if (isLocalGatewayMode()) {
    try {
      const data = await fetchGateway<{ customer: BillingCustomerSnapshot | null }>(
        `/billing/customer?product=${encodeURIComponent(product)}&userId=${encodeURIComponent(userId)}`,
      );
      return data.customer?.plan ?? "free";
    } catch {
      return "free";
    }
  }

  const db = await getDbAsync();
  const [row] = await db
    .select()
    .from(billingCustomers)
    .where(
      and(eq(billingCustomers.product, product), eq(billingCustomers.externalUserId, userId)),
    )
    .limit(1);
  return (row?.plan as PlanTier) ?? "free";
}

export async function loadBillingCustomer(
  product: ProductId,
  userId: string | null | undefined,
): Promise<BillingCustomerSnapshot | null> {
  if (!userId) return null;

  if (isLocalGatewayMode()) {
    try {
      const data = await fetchGateway<{ customer: BillingCustomerSnapshot | null }>(
        `/billing/customer?product=${encodeURIComponent(product)}&userId=${encodeURIComponent(userId)}`,
      );
      return data.customer;
    } catch {
      return null;
    }
  }

  const db = await getDbAsync();
  const [row] = await db
    .select()
    .from(billingCustomers)
    .where(
      and(eq(billingCustomers.product, product), eq(billingCustomers.externalUserId, userId)),
    )
    .limit(1);
  if (!row) return null;
  return {
    product: row.product as ProductId,
    externalUserId: row.externalUserId,
    stripeCustomerId: row.stripeCustomerId,
    stripeSubscriptionId: row.stripeSubscriptionId ?? null,
    plan: row.plan as PlanTier,
    showBadge: row.showBadge,
  };
}

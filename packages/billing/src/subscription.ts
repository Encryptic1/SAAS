import type Stripe from "stripe";
import type { ProductId, PlanTier } from "./plans";
import { shouldShowBadge } from "./plans";

export function getProductFromMetadata(
  metadata: Stripe.Metadata | null | undefined,
): ProductId | null {
  const product = metadata?.product;
  if (
    product === "standard-polls" ||
    product === "standard-proof" ||
    product === "standard-metrics" ||
    product === "standard-hook" ||
    product === "standard-release" ||
    product === "standard-links" ||
    product === "standard-vault" ||
    product === "standard-lens" ||
    product === "standard-cron" ||
    product === "standard-snippets" ||
    product === "standard-status" ||
    product === "standard-regex" ||
    product === "standard-postmortem"
  ) {
    return product;
  }
  return null;
}

export function resolvePlanTierFromSubscription(subscription: Stripe.Subscription): PlanTier {
  const meta = subscription.items.data[0]?.price.metadata?.plan_id;
  if (meta === "starter" || meta === "growth" || meta === "business") {
    return meta;
  }
  const lookup = subscription.items.data[0]?.price.lookup_key ?? "";
  if (lookup.includes("growth")) return "growth";
  if (lookup.includes("starter")) return "starter";
  if (lookup.includes("business")) return "business";
  return "free";
}

export interface BillingUpsertPayload {
  product: ProductId;
  externalUserId: string;
  stripeCustomerId: string;
  stripeSubscriptionId: string | null;
  plan: PlanTier;
  showBadge: boolean;
}

export function buildBillingUpsert(
  product: ProductId,
  userId: string,
  customerId: string,
  subscription: Stripe.Subscription | null,
): BillingUpsertPayload {
  const plan =
    subscription && (subscription.status === "active" || subscription.status === "trialing")
      ? resolvePlanTierFromSubscription(subscription)
      : "free";

  return {
    product,
    externalUserId: userId,
    stripeCustomerId: customerId,
    stripeSubscriptionId: subscription?.id ?? null,
    plan,
    showBadge: shouldShowBadge(product, plan),
  };
}

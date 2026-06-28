import type Stripe from "stripe";
import { and, eq } from "drizzle-orm";
import { getDbAsync } from "@market-standard/db";
import { billingCustomers } from "@market-standard/db/schema/shared";
import type { ProductId } from "./plans";
import { buildBillingUpsert, getProductFromMetadata } from "./subscription";
import { getStripe } from "./stripe";

export async function upsertBillingCustomer(payload: {
  product: ProductId;
  externalUserId: string;
  stripeCustomerId: string;
  stripeSubscriptionId: string | null;
  plan: string;
  showBadge: boolean;
}): Promise<void> {
  const db = await getDbAsync();
  const existing = await db
    .select()
    .from(billingCustomers)
    .where(
      and(
        eq(billingCustomers.product, payload.product),
        eq(billingCustomers.externalUserId, payload.externalUserId),
      ),
    )
    .limit(1);

  const row = existing[0];

  if (row) {
    await db
      .update(billingCustomers)
      .set({
        stripeCustomerId: payload.stripeCustomerId,
        stripeSubscriptionId: payload.stripeSubscriptionId,
        plan: payload.plan,
        showBadge: payload.showBadge,
        updatedAt: new Date(),
      })
      .where(eq(billingCustomers.id, row.id));
    return;
  }

  await db.insert(billingCustomers).values({
    product: payload.product,
    externalUserId: payload.externalUserId,
    stripeCustomerId: payload.stripeCustomerId,
    stripeSubscriptionId: payload.stripeSubscriptionId,
    plan: payload.plan,
    showBadge: payload.showBadge,
  });
}

export async function handlePortfolioStripeEvent(event: Stripe.Event): Promise<boolean> {
  const stripe = getStripe();

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const product = getProductFromMetadata(session.metadata);
    if (!product) return false;

    const userId = session.client_reference_id ?? session.metadata?.user_id;
    if (!userId || !session.customer) return false;

    const customerId = typeof session.customer === "string" ? session.customer : session.customer.id;
    let subscription: Stripe.Subscription | null = null;
    if (session.subscription) {
      const subId = typeof session.subscription === "string" ? session.subscription : session.subscription.id;
      subscription = await stripe.subscriptions.retrieve(subId);
    }

    await upsertBillingCustomer(buildBillingUpsert(product, userId, customerId, subscription));
    return true;
  }

  if (
    event.type === "customer.subscription.updated" ||
    event.type === "customer.subscription.deleted"
  ) {
    const subscription = event.data.object as Stripe.Subscription;
    const product = getProductFromMetadata(subscription.metadata);
    const priceProduct = subscription.items.data[0]?.price.metadata?.product;
    if (!product && !getProductFromMetadata({ product: priceProduct ?? "" })) return false;
    const resolvedProduct = (product ?? priceProduct) as ProductId;

    const userId = subscription.metadata?.user_id;
    const customerId =
      typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id;
    if (!userId) return false;

    const active =
      event.type !== "customer.subscription.deleted" &&
      (subscription.status === "active" || subscription.status === "trialing");

    await upsertBillingCustomer(
      buildBillingUpsert(
        resolvedProduct,
        userId,
        customerId,
        active ? subscription : null,
      ),
    );
    return true;
  }

  return false;
}

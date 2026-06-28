import type Stripe from "stripe";
import { verifyWebhook } from "./webhooks";
import { handlePortfolioStripeEvent } from "./portfolio-webhook";
import { getProductFromMetadata } from "./subscription";

async function portfolioWebhookHandler(event: Stripe.Event): Promise<void> {
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    if (!getProductFromMetadata(session.metadata)) return;
    await handlePortfolioStripeEvent(event);
    return;
  }

  if (
    event.type === "customer.subscription.updated" ||
    event.type === "customer.subscription.deleted"
  ) {
    const sub = event.data.object as Stripe.Subscription;
    const product =
      getProductFromMetadata(sub.metadata) ??
      getProductFromMetadata(sub.items.data[0]?.price.metadata);
    if (!product) return;
    await handlePortfolioStripeEvent(event);
  }
}

export async function handleStripeWebhookRequest(
  body: string,
  signature: string,
): Promise<Response> {
  const result = await verifyWebhook(body, signature, {
    "checkout.session.completed": portfolioWebhookHandler,
    "customer.subscription.updated": portfolioWebhookHandler,
    "customer.subscription.deleted": portfolioWebhookHandler,
  });

  if (!result.received) {
    return Response.json({ error: result.error }, { status: 400 });
  }

  return Response.json({ received: true, type: result.type });
}

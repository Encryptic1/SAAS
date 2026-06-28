import type Stripe from "stripe";
import { getStripe } from "./stripe";

export type WebhookHandler = (event: Stripe.Event) => Promise<void>;

export async function verifyWebhook(
  body: string,
  signature: string,
  handlers: Partial<Record<Stripe.Event.Type, WebhookHandler>>,
): Promise<{ received: true; type: string } | { received: false; error: string }> {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    return { received: false, error: "Missing STRIPE_WEBHOOK_SECRET" };
  }

  const stripe = getStripe();
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, secret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Webhook verification failed";
    return { received: false, error: message };
  }

  const handler = handlers[event.type];
  if (handler) {
    await handler(event);
  }

  return { received: true, type: event.type };
}

export const defaultWebhookHandlers: Partial<Record<Stripe.Event.Type, WebhookHandler>> = {
  "checkout.session.completed": async (event) => {
    const session = event.data.object as Stripe.Checkout.Session;
    console.info("[billing] checkout.session.completed", session.id, session.metadata);
  },
  "customer.subscription.updated": async (event) => {
    const subscription = event.data.object as Stripe.Subscription;
    console.info("[billing] subscription.updated", subscription.id, subscription.status);
  },
  "customer.subscription.deleted": async (event) => {
    const subscription = event.data.object as Stripe.Subscription;
    console.info("[billing] subscription.deleted", subscription.id);
  },
};

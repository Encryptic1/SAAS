import type { ProductId } from "./plans";
import { getStripe } from "./stripe";

export interface CheckoutParams {
  product: ProductId;
  priceId: string;
  customerId?: string;
  customerEmail?: string;
  clientReferenceId?: string;
  successUrl: string;
  cancelUrl: string;
  metadata?: Record<string, string>;
}

export async function createCheckoutSession(params: CheckoutParams) {
  const stripe = getStripe();
  const userId = params.clientReferenceId ?? params.metadata?.user_id;

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: params.customerId,
    customer_email: params.customerId ? undefined : params.customerEmail,
    ...(params.clientReferenceId ? { client_reference_id: params.clientReferenceId } : {}),
    line_items: [{ price: params.priceId, quantity: 1 }],
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
    metadata: {
      product: params.product,
      ...params.metadata,
    },
    subscription_data: {
      metadata: {
        product: params.product,
        ...(userId ? { user_id: userId } : {}),
        ...params.metadata,
      },
    },
    allow_promotion_codes: true,
  });

  return session;
}

export async function createPortalSession(customerId: string, returnUrl: string) {
  const stripe = getStripe();
  return stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });
}

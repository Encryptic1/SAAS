import { NextResponse } from "next/server";
import { getUser } from "@market-standard/auth";
import {
  createCheckoutSession,
  createPortalSession,
  getPaidPlans,
  type PlanTier,
  type ProductId,
} from "@market-standard/billing";
import { billingCustomers } from "@market-standard/db/schema/shared";
import { getDbAsync } from "@market-standard/db";
import { and, eq } from "drizzle-orm";

export function createCheckoutHandler(product: ProductId) {
  return async function POST(request: Request) {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json().catch(() => ({}))) as { tier?: PlanTier };
    const tier = body.tier ?? "starter";
    const plan = getPaidPlans(product).find((p) => p.tier === tier);
    if (!plan?.stripePriceId) {
      // 4xx — misconfigured (no STRIPE_PRICE_* env var), not a server error.
      return NextResponse.json({ error: "Stripe price not configured" }, { status: 400 });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    try {
      const session = await createCheckoutSession({
        product,
        priceId: plan.stripePriceId,
        customerEmail: user.email,
        clientReferenceId: user.id,
        successUrl: `${appUrl}/dashboard/billing?upgraded=true`,
        cancelUrl: `${appUrl}/dashboard/billing`,
        metadata: { user_id: user.id, plan_id: tier },
      });
      return NextResponse.json({ url: session.url });
    } catch (err) {
      // Stripe not configured (no STRIPE_SECRET_KEY) or Stripe API error.
      // 4xx — misconfigured, not a server crash.
      const message = err instanceof Error ? err.message : "Stripe checkout unavailable";
      return NextResponse.json({ error: message }, { status: 400 });
    }
  };
}

export function createPortalHandler(product: ProductId) {
  return async function POST() {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let db;
    try {
      db = await getDbAsync();
    } catch {
      // Local dev without a reachable database — no billing account possible.
      return NextResponse.json({ error: "No billing account" }, { status: 404 });
    }

    let row;
    try {
      [row] = await db
        .select()
        .from(billingCustomers)
        .where(
          and(eq(billingCustomers.product, product), eq(billingCustomers.externalUserId, user.id)),
        )
        .limit(1);
    } catch {
      // Table not available in local dev — treat as no billing account.
      return NextResponse.json({ error: "No billing account" }, { status: 404 });
    }

    if (!row?.stripeCustomerId) {
      return NextResponse.json({ error: "No billing account" }, { status: 404 });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    try {
      const portal = await createPortalSession(row.stripeCustomerId, `${appUrl}/dashboard/billing`);
      return NextResponse.json({ url: portal.url });
    } catch (err) {
      // Stripe not configured (no STRIPE_SECRET_KEY) or Stripe API error.
      const message = err instanceof Error ? err.message : "Stripe portal unavailable";
      return NextResponse.json({ error: message }, { status: 400 });
    }
  };
}

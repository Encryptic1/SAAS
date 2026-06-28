import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@market-standard/billing";
import { getDbAsync } from "@market-standard/db";
import { metricSnapshots, stripeAccounts } from "@market-standard/db/schema/metrics";
import { eq } from "@market-standard/db/query";

export const maxDuration = 60;

async function listAllSubscriptions(
  stripe: Stripe,
  stripeAccountId: string,
  status: Stripe.SubscriptionListParams["status"],
): Promise<Stripe.Subscription[]> {
  const all: Stripe.Subscription[] = [];
  let startingAfter: string | undefined;

  while (true) {
    const page = await stripe.subscriptions.list(
      {
        limit: 100,
        status,
        ...(startingAfter ? { starting_after: startingAfter } : {}),
      },
      { stripeAccount: stripeAccountId },
    );
    all.push(...page.data);
    if (!page.has_more) break;
    startingAfter = page.data[page.data.length - 1]?.id;
  }

  return all;
}

function subscriptionMrr(sub: Stripe.Subscription): number {
  let mrr = 0;
  for (const item of sub.items.data) {
    const amount = item.price?.unit_amount ?? 0;
    const interval = item.price?.recurring?.interval;
    if (interval === "month") mrr += amount / 100;
    else if (interval === "year") mrr += amount / 100 / 12;
  }
  return mrr;
}

function planKey(sub: Stripe.Subscription): string {
  const item = sub.items.data[0];
  return item?.price?.nickname ?? item?.price?.id ?? "unknown";
}

/**
 * Vercel Cron: pre-compute MRR/churn/LTV snapshots for all connected accounts.
 * Schedule: 0 6 * * * (daily at 6am UTC)
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Local dev / misconfigured: no DB or no Stripe key → graceful no-op.
  // Crons are infrastructure; in local dev they should never 500.
  let db;
  try {
    db = await getDbAsync();
  } catch {
    return NextResponse.json({ status: "skipped", reason: "db_unavailable" });
  }

  let accounts;
  try {
    accounts = await db.select().from(stripeAccounts);
  } catch {
    return NextResponse.json({ status: "skipped", reason: "db_unavailable" });
  }

  let stripe: ReturnType<typeof getStripe>;
  try {
    stripe = getStripe();
  } catch {
    return NextResponse.json({
      status: "skipped",
      reason: "stripe_not_configured",
      processed: 0,
      timestamp: new Date().toISOString(),
    });
  }

  let processed = 0;
  const thirtyDaysAgo = Math.floor(Date.now() / 1000) - 30 * 24 * 60 * 60;

  for (const account of accounts) {
    try {
      const activeSubs = await listAllSubscriptions(stripe, account.stripeAccountId, "active");
      const trialingSubs = await listAllSubscriptions(stripe, account.stripeAccountId, "trialing");
      const canceledSubs = await listAllSubscriptions(stripe, account.stripeAccountId, "canceled");

      const allActive = [...activeSubs, ...trialingSubs];
      const canceledRecent = canceledSubs.filter(
        (s) => s.canceled_at != null && s.canceled_at >= thirtyDaysAgo,
      );

      let mrr = 0;
      const byPlan: Record<string, { mrr: number; count: number }> = {};

      for (const sub of allActive) {
        const subMrr = subscriptionMrr(sub);
        mrr += subMrr;
        const plan = planKey(sub);
        if (!byPlan[plan]) byPlan[plan] = { mrr: 0, count: 0 };
        byPlan[plan].mrr += subMrr;
        byPlan[plan].count += 1;
      }

      const activeCount = allActive.length;
      const churnDenominator = activeCount + canceledRecent.length;
      const churnRate = churnDenominator > 0 ? canceledRecent.length / churnDenominator : 0;
      const ltv = churnRate > 0 ? mrr / churnRate : mrr * 12;

      await db.insert(metricSnapshots).values({
        stripeAccountId: account.id,
        snapshotDate: new Date(),
        mrr: mrr.toFixed(2),
        arr: (mrr * 12).toFixed(2),
        churnRate: churnRate.toFixed(4),
        ltv: ltv.toFixed(2),
        activeSubscriptions: activeCount,
        breakdown: {
          source: "cron_sync",
          by_plan: byPlan,
          canceled_last_30d: canceledRecent.length,
        },
      });

      await db
        .update(stripeAccounts)
        .set({ lastSyncAt: new Date() })
        .where(eq(stripeAccounts.id, account.id));

      processed++;
    } catch (err) {
      console.error(`[metrics] Sync failed for ${account.stripeAccountId}:`, err);
    }
  }

  return NextResponse.json({
    status: "ok",
    processed,
    timestamp: new Date().toISOString(),
  });
}

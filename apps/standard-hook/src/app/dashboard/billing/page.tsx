import { Card, CardContent, CardDescription, CardHeader, CardTitle, UpgradeButton } from "@market-standard/ui";
import { getPlan, getPaidPlans, PLANS } from "@market-standard/billing";
import { getDbAsync, isLocalGatewayMode } from "@market-standard/db";
import { billingCustomers } from "@market-standard/db/schema/shared";
import { and, eq } from "@market-standard/db/query";
import { PortalButton } from "@/components/portal-button";
import { getOwnerId } from "@/lib/owner";

export const dynamic = "force-dynamic";

const PRODUCT = "standard-hook" as const;

interface BillingPageProps {
  searchParams: Promise<{ upgraded?: string }>;
}

export default async function BillingPage({ searchParams }: BillingPageProps) {
  const params = await searchParams;
  const ownerId = await getOwnerId();
  let currentPlan = "free";

  if (!isLocalGatewayMode() && ownerId) {
    const db = await getDbAsync();
    const [billing] = await db
      .select()
      .from(billingCustomers)
      .where(
        and(eq(billingCustomers.product, PRODUCT), eq(billingCustomers.externalUserId, ownerId)),
      )
      .limit(1);
    if (billing?.plan) currentPlan = billing.plan;
  }

  const plan = getPlan(PRODUCT, currentPlan as "free" | "starter");
  const paidPlans = getPaidPlans(PRODUCT);

  return (
    <>
      <h1 className="ms-app-title">Billing</h1>
      <p className="mt-2 ms-app-muted">Manage your Standard Hook subscription.</p>

      {params.upgraded === "true" && (
        <p className="mt-4 text-sm ms-app-success">Subscription updated successfully.</p>
      )}

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Current plan</CardTitle>
          <CardDescription>
            {plan.name} — ${plan.priceMonthly}/mo
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ul className="text-sm ms-app-muted">
            <li>Inboxes: {String(plan.limits.inboxes)}</li>
            <li>Events/month: {String(plan.limits.eventsPerMonth)}</li>
            <li>Badge: {plan.showBadge ? "Required" : "Optional"}</li>
          </ul>
          {currentPlan !== "free" && !isLocalGatewayMode() && <PortalButton />}
        </CardContent>
      </Card>

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {paidPlans.map((tier) => {
          const isCurrent = tier.tier === currentPlan;
          return (
            <Card key={tier.tier}>
              <CardHeader>
                <CardTitle>{tier.name}</CardTitle>
                <CardDescription>${tier.priceMonthly}/month</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="text-sm ms-app-muted">
                  <li>{String(tier.limits.inboxes)} inboxes</li>
                  <li>{String(tier.limits.eventsPerMonth)} events/mo</li>
                  <li>{tier.showBadge ? "Badge required" : "Badge optional"}</li>
                </ul>
                {isCurrent ? (
                  <p className="text-sm text-[var(--color-flood)]">Current plan</p>
                ) : tier.tier !== "free" && tier.stripePriceId ? (
                  <UpgradeButton tier={tier.tier as "starter" | "growth" | "business"}>
                    Upgrade to {tier.name}
                  </UpgradeButton>
                ) : (
                  <p className="text-sm ms-app-muted">Stripe price not configured</p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <p className="mt-6 text-xs ms-app-muted">
        All plans: {PLANS[PRODUCT].map((p) => p.name).join(" · ")}
      </p>
    </>
  );
}

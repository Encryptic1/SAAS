import { Card, CardContent, CardDescription, CardHeader, CardTitle, UpgradeButton } from "@market-standard/ui";
import { getPlan, getPaidPlans, PLANS, loadCurrentPlan } from "@market-standard/billing";
import { getOwnerId } from "@/lib/owner";
import { PortalButton } from "@/components/portal-button";

export const dynamic = "force-dynamic";

const PRODUCT = "standard-links" as const;

interface BillingPageProps {
  searchParams: Promise<{ upgraded?: string }>;
}

export default async function BillingPage({ searchParams }: BillingPageProps) {
  const params = await searchParams;
  const ownerId = await getOwnerId();
  const currentPlan = await loadCurrentPlan(PRODUCT, ownerId);

  const plan = getPlan(PRODUCT, currentPlan as "free" | "starter");
  const paidPlans = getPaidPlans(PRODUCT);

  return (
    <>
      <h1 className="ms-app-title">Billing</h1>
      <p className="mt-2 ms-app-muted">Manage your Standard Links subscription.</p>

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
            <li>Links: {String(plan.limits.links)}</li>
            <li>Badge: {plan.showBadge ? "Required" : "Optional"}</li>
          </ul>
          {currentPlan !== "free" && <PortalButton />}
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
                  <li>{String(tier.limits.links)} links</li>
                  <li>{tier.showBadge ? "Badge required" : "Badge optional"}</li>
                </ul>
                {isCurrent ? (
                  <p className="text-sm text-[var(--color-flood)]">Current plan</p>
                ) : tier.stripePriceId ? (
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

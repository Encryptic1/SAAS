import { getUser } from "@market-standard/auth";
import { getPaidPlans, loadCurrentPlan } from "@market-standard/billing";
import { BillingPanel } from "@market-standard/ui";

export const dynamic = "force-dynamic";

interface BillingPageProps {
  searchParams: Promise<{ upgraded?: string }>;
}

export default async function BillingPage({ searchParams }: BillingPageProps) {
  const params = await searchParams;
  const user = await getUser();
  const plans = getPaidPlans("standard-polls");
  const currentPlan = await loadCurrentPlan("standard-polls", user?.id);

  return (
    <BillingPanel
      productName="Standard Polls"
      currentPlan={currentPlan}
      plans={plans.map((p) => ({
        tier: p.tier as "starter" | "growth" | "business",
        name: p.name,
        priceMonthly: p.priceMonthly,
        stripePriceId: p.stripePriceId,
      }))}
      upgraded={params.upgraded === "true"}
    />
  );
}

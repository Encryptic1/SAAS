import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@market-standard/ui";
import { getPlan, shouldShowBadge } from "@market-standard/billing";
import { BadgeToggle } from "@/components/badge-toggle";
import { listOwnerCollections } from "@/lib/proof-data";

export const dynamic = "force-dynamic";

const PRODUCT = "standard-proof" as const;

export default async function SettingsPage() {
  const collections = await listOwnerCollections();
  const primary = collections[0];

  const planTier = (primary?.plan ?? "free") as "free" | "starter" | "growth";
  const plan = getPlan(PRODUCT, planTier);
  const canToggleBadge = !shouldShowBadge(PRODUCT, planTier);

  return (
    <>
      <h1 className="ms-app-title">Settings</h1>
      <p className="mt-2 ms-app-muted">Collection preferences and branding.</p>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Branding</CardTitle>
          <CardDescription>
            {plan.name} plan — badge {plan.showBadge ? "required on free tier" : "can be hidden on paid tiers"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!primary ? (
            <p className="text-sm ms-app-muted">Create a collection to configure badge settings.</p>
          ) : (
            <BadgeToggle
              collectionId={primary.id}
              showBadge={primary.showBadge}
              canToggle={canToggleBadge}
            />
          )}
        </CardContent>
      </Card>
    </>
  );
}

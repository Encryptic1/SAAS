"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/card";
import { UpgradeButton } from "./upgrade-button";

export interface BillingPlanOption {
  tier: "starter" | "growth" | "business";
  name: string;
  priceMonthly: number;
  stripePriceId?: string;
}

export interface BillingPanelProps {
  productName: string;
  currentPlan: string;
  plans: BillingPlanOption[];
  upgraded?: boolean;
}

export function BillingPanel({ productName, currentPlan, plans, upgraded }: BillingPanelProps) {
  const [portalLoading, setPortalLoading] = useState(false);
  const [portalError, setPortalError] = useState<string | null>(null);

  async function openPortal() {
    setPortalLoading(true);
    setPortalError(null);
    try {
      const res = await fetch("/api/billing/portal", { method: "POST" });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) {
        setPortalError(data.error ?? "Portal unavailable");
        return;
      }
      window.location.href = data.url;
    } catch {
      setPortalError("Could not open billing portal");
    } finally {
      setPortalLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="ms-dash-page-title">Billing</h1>
        <p className="mt-1 text-sm text-[var(--text-mist)]">
          Manage your {productName} subscription.
        </p>
        {upgraded && (
          <p className="mt-2 text-sm text-[var(--color-flood)]">Plan updated successfully.</p>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Current plan</CardTitle>
          <CardDescription>
            You are on the <strong className="text-[var(--text-foam)]">{currentPlan}</strong> plan.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <button
            type="button"
            onClick={openPortal}
            disabled={portalLoading}
            className="ms-btn ms-btn-gilt"
          >
            {portalLoading ? "Opening…" : "Manage subscription"}
          </button>
          {portalError && <p className="text-xs text-[var(--color-breach)]">{portalError}</p>}
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {plans.map((plan) => (
          <Card key={plan.tier}>
            <CardHeader>
              <CardTitle>{plan.name}</CardTitle>
              <CardDescription>${plan.priceMonthly}/mo</CardDescription>
            </CardHeader>
            <CardContent>
              {currentPlan.toLowerCase() === plan.tier ? (
                <span className="text-sm text-[var(--color-flood)]">Current plan</span>
              ) : plan.stripePriceId ? (
                <UpgradeButton tier={plan.tier}>Choose {plan.name}</UpgradeButton>
              ) : (
                <span className="text-sm text-[var(--text-mist)]">Stripe price not configured</span>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

import { NextResponse } from "next/server";
import { resolvePortfolioUrl } from "@market-standard/ui";

const STRIPE_CONNECT_BASE = "https://connect.stripe.com/oauth/authorize";

export async function GET() {
  const clientId = process.env.STRIPE_CONNECT_CLIENT_ID;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? resolvePortfolioUrl("metrics");

  if (!clientId) {
    return NextResponse.json({ error: "Missing STRIPE_CONNECT_CLIENT_ID" }, { status: 500 });
  }

  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    scope: "read_only",
    redirect_uri: `${appUrl}/api/stripe/callback`,
    state: crypto.randomUUID(),
  });

  return NextResponse.redirect(`${STRIPE_CONNECT_BASE}?${params.toString()}`);
}
